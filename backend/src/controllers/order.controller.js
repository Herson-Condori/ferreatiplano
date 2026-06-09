// backend/src/controllers/order.controller.js
import { PrismaClient } from '@prisma/client';
import culqi from '../config/culqi.js';
import { generateInvoice } from '../services/invoice.service.js';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// ✅ CREAR PEDIDO (con método de pago + facturación automática)
// ─────────────────────────────────────────────────────────────
export const createOrder = async (req, res) => {
  try {
    const { 
      items,           // [{ productId, cantidad, precioUnitario }]
      direccionEntrega,
      lat, 
      lng, 
      costoDelivery, 
      notas,
      metodoPago,      // 'CULQI' | 'YAPE' | 'CONTRA_ENTREGA' | 'EFECTIVO'
      culqiToken,      // Solo si metodoPago === 'CULQI'
      yapeReference    // Solo si metodoPago === 'YAPE' (número de operación)
    } = req.body;

    // Map EFECTIVO to CONTRA_ENTREGA internally for database storage
    let finalMetodoPago = metodoPago;
    if (metodoPago === 'EFECTIVO') {
      finalMetodoPago = 'CONTRA_ENTREGA';
    }

    let clienteId = req.user?.id;
    let vendedorId = null;

    if (req.user?.rol === 'VENDEDOR' || req.user?.rol === 'ADMIN') {
      vendedorId = req.user.id;
      if (req.body.clienteId) {
        clienteId = req.body.clienteId;
      }
    }
    
    // Validación: Cliente debe estar logueado (excepto contra entrega)
    if (!clienteId && finalMetodoPago !== 'CONTRA_ENTREGA') {
      return res.status(401).json({ error: 'Debes iniciar sesión para pagar' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // ─────────────────────────────────────────────────────────
    // 1️⃣ Calcular total y verificar stock de cada producto
    // ─────────────────────────────────────────────────────────
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const producto = await prisma.producto.findUnique({
        where: { id: item.productId }
      });

      if (!producto || !producto.activo) {
        return res.status(400).json({ error: `Producto no disponible` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para: ${producto.nombre}` });
      }

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      // ✅ CORRECCIÓN CLAVE: Usar 'producto: { connect: { id: ... } }'
      orderItems.push({
        producto: {
          connect: { id: item.productId }
        },
        cantidad: item.cantidad,
        precioUnitario: producto.precio
      });
    }

    // Agregar costo de delivery al total
    total += parseFloat(costoDelivery || 0);

    // ─────────────────────────────────────────────────────────
    // 2️⃣ Crear el pedido en la base de datos
    // ─────────────────────────────────────────────────────────
    const pedido = await prisma.pedido.create({
      data: {
        clienteId: clienteId || null,
        vendedorId: vendedorId,
        estado: 'NUEVO',
        total,
        metodoPago: finalMetodoPago,
        direccionEntrega,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        costoDelivery: parseFloat(costoDelivery || 0),
        notas,
        yapeReference: yapeReference || null,
        items: {
          create: orderItems
        }
      },
      include: { 
        items: { include: { producto: true } },
        cliente: true
      }
    });

    // ─────────────────────────────────────────────────────────
    // 3️⃣ Procesar pago según método seleccionado
    // ─────────────────────────────────────────────────────────
    let pagoExitoso = false;

    // 🟡 CULQI (Tarjeta)
    // 🟡 CULQI (Tarjeta)
    if (finalMetodoPago === 'CULQI' && culqiToken) {
      if (!culqi) {
        await prisma.pedido.delete({ where: { id: pedido.id } });
        return res.status(503).json({ 
          error: 'Pagos con tarjeta no disponibles temporalmente',
          suggestion: 'Usa Contra Entrega o Yape para completar tu pedido'
        });
      }
      
      try {
        const charge = await culqi.charges.create({
          source: culqiToken,
          amount_in_cents: Math.round(total * 100),
          currency_code: 'PEN',
          description: `Pedido #${pedido.id} - Ferrealtiplano`
        });

        if (charge.status === 'paid') {
          pagoExitoso = true;
          await prisma.pago.create({
            data: {
              pedidoId: pedido.id,
              monto: total,
              metodo: 'CULQI',
              estado: 'PAGADO',
              culqiChargeId: charge.id
            }
          });
        }
      } catch (culqiErr) {
        console.error('Error en Culqi:', culqiErr);
        await prisma.pedido.delete({ where: { id: pedido.id } });
        return res.status(400).json({ 
          error: 'Error procesando el pago con tarjeta',
          details: culqiErr.message 
        });
      }
    } 
    // 🟣 YAPE (Pago manual)
    else if (finalMetodoPago === 'YAPE') {
      await prisma.pago.create({
        data: {
          pedidoId: pedido.id,
          monto: total,
          metodo: 'YAPE',
          estado: yapeReference ? 'PAGADO' : 'PENDIENTE'
        }
      });
      pagoExitoso = !!yapeReference;
    }
    // 🟤 CONTRA ENTREGA / EFECTIVO (Pago al recibir o en tienda)
    else if (finalMetodoPago === 'CONTRA_ENTREGA') {
      await prisma.pago.create({
        data: {
          pedidoId: pedido.id,
          monto: total,
          metodo: 'CONTRA_ENTREGA',
          estado: vendedorId ? 'PAGADO' : 'PENDIENTE' // Para POS físico se considera pagado al instante
        }
      });
      pagoExitoso = true; // Se considera exitoso para continuar el flujo
    }

    // ─────────────────────────────────────────────────────────
    // 4️⃣ Si el pago fue exitoso: actualizar stock y generar comprobante
    // ─────────────────────────────────────────────────────────
    if (pagoExitoso || finalMetodoPago === 'CONTRA_ENTREGA') {
      
      // ✅ Actualizar stock de productos
      for (const item of orderItems) {
        await prisma.producto.update({
          where: { id: item.producto.connect.id },
          data: { stock: { decrement: item.cantidad } }
        });
      }

      // ✅ Actualizar estado del pedido (Si es venta en tienda POS por vendedor, se marca como entregado)
      const nuevoEstado = vendedorId ? 'ENTREGADO' : (pagoExitoso ? 'EN_PREPARACION' : 'NUEVO');
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { estado: nuevoEstado }
      });

      // ✅ GENERAR COMPROBANTE ELECTRÓNICO (Nubefact)
      if (pagoExitoso) {
        try {
          const invoiceResult = await generateInvoice(pedido);
          if (!invoiceResult.success) {
            console.error('⚠️ Error generando comprobante:', invoiceResult.error);
          }
        } catch (invoiceErr) {
          console.error('⚠️ Excepción en facturación:', invoiceErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // 5️⃣ Respuesta exitosa al cliente
    // ─────────────────────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: finalMetodoPago === 'CONTRA_ENTREGA' 
        ? 'Pedido creado. Paga al recibir.' 
        : 'Pago procesado exitosamente',
      data: {
        pedidoId: pedido.id,
        total,
        estado: vendedorId ? 'ENTREGADO' : (pagoExitoso ? 'EN_PREPARACION' : 'NUEVO'),
        metodoPago: finalMetodoPago,
        nextSteps: finalMetodoPago === 'YAPE' && !yapeReference
          ? 'Envía tu comprobante de Yape al WhatsApp 942-318-219'
          : null
      }
    });

  } catch (err) {
    console.error('❌ Error creando pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ✅ WEBHOOK: Confirmación de pago de Culqi + Facturación
// ─────────────────────────────────────────────────────────────
export const culqiWebhook = async (req, res) => {
  try {
    if (!culqi) {
      return res.status(200).json({ received: true, note: 'Culqi no configurado' });
    }

    const { event, data } = req.body;

    if (event === 'charge.succeeded') {
      const { id: chargeId, order_id: pedidoId, amount } = data;

      const pedido = await prisma.pedido.findUnique({ 
        where: { id: pedidoId },
        include: { items: { include: { producto: true } }, cliente: true }
      });
      
      if (pedido && pedido.estado === 'NUEVO') {
        await prisma.$transaction(async (tx) => {
          await tx.pago.updateMany({
            where: { pedidoId, culqiChargeId: chargeId },
            data: { estado: 'PAGADO' }
          });

          await tx.pedido.update({
            where: { id: pedidoId },
            data: { estado: 'EN_PREPARACION' }
          });

          for (const item of pedido.items) {
            await tx.producto.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.cantidad } }
            });
          }
        });

        try {
          await generateInvoice(pedido);
        } catch (invoiceErr) {
          console.error('Excepción en facturación webhook:', invoiceErr);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error en webhook Culqi:', err);
    res.status(500).json({ error: 'Webhook error' });
  }
};

// ─────────────────────────────────────────────────────────────
// ✅ OBTENER PEDIDOS DEL CLIENTE (con comprobantes)
// ─────────────────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { 
            producto: { 
              select: { id: true, nombre: true, imagenes: true, precio: true } 
            } 
          }
        },
        pago: { select: { estado: true, metodo: true, culqiChargeId: true } },
        comprobante: { select: { tipo: true, serie: true, numero: true, pdfUrl: true, sunatHash: true, estado: true } }
      },
      take: 20
    });

    res.json({ success: true, data: pedidos });
  } catch (err) {
    console.error('Error obteniendo pedidos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// ✅ OBTENER DETALLE DE PEDIDO (para cliente o admin)
// ─────────────────────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: { 
            producto: { select: { nombre: true, precio: true, imagenes: true, categoria: true } } 
          }
        },
        pago: true,
        comprobante: true,
        cliente: { select: { nombre: true, email: true, telefono: true, direccion: true } }
      }
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.clienteId !== req.user.id && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json({ success: true, data: pedido });
  } catch (err) {
    console.error('Error obteniendo pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// ✅ ACTUALIZAR ESTADO DE PEDIDO (solo ADMIN/VENDEDOR)
// ─────────────────────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { estado } = req.body;
    const { id: pedidoId } = req.params;

    const estadosValidos = ['NUEVO', 'EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado de pedido no válido' });
    }

    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updated = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado, updatedAt: new Date() },
      include: { items: { include: { producto: true } }, comprobante: true }
    });

    if (estado === 'ENTREGADO' && !updated.comprobante) {
      try {
        await generateInvoice(updated);
      } catch (err) {
        console.error('Error generando comprobante al entregar:', err);
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error actualizando estado de pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// ✅ LISTAR TODOS LOS PEDIDOS (para ADMIN/VENDEDOR)
// ─────────────────────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 100, estado } = req.query;

    const where = {};
    
    // Filtro por estado si se proporciona
    if (estado) {
      where.estado = estado;
    }

    // Si es VENDEDOR, ver sus pedidos o pedidos online (vendedorId: null)
    if (req.user.rol === 'VENDEDOR') {
      where.OR = [
        { vendedorId: req.user.id },
        { vendedorId: null }
      ];
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
        include: {
          cliente: { 
            select: { 
              id: true,
              nombre: true, 
              email: true,
              telefono: true
            } 
          },
          items: { 
            include: { 
              producto: { 
                select: { 
                  id: true,
                  nombre: true, 
                  precio: true,
                  imagenes: true
                } 
              } 
            } 
          },
          pago: { 
            select: { 
              metodo: true, 
              estado: true 
            } 
          }
        }
      }),
      prisma.pedido.count({ where })
    ]);

    res.json({
      success: true,
      data: pedidos,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (err) {
    console.error('Error listando pedidos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};