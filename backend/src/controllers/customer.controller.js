// backend/src/controllers/customer.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Obtener lista de clientes (con filtros)
export const getCustomers = async (req, res) => {
  try {
    const { busqueda, estado, fechaDesde, fechaHasta, page = 1, limit = 20 } = req.query;

    const where = {
      rol: 'CLIENTE',
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { email: { contains: busqueda, mode: 'insensitive' } },
          { telefono: { contains: busqueda, mode: 'insensitive' } }
        ]
      }),
      ...(estado && { activo: estado === 'activo' }),
      ...(fechaDesde && { createdAt: { gte: new Date(fechaDesde) } }),
      ...(fechaHasta && { createdAt: { lte: new Date(fechaHasta) } })
    };

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    const [clientes, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          direccion: true,
          ruc: true,
          activo: true,
          createdAt: true,
          _count: {
            select: { pedidos: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: clientes,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });

  } catch (err) {
    console.error('Error obteniendo clientes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Obtener detalle completo de un cliente
export const getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        ruc: true,
        activo: true,
        createdAt: true,
        pedidos: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            total: true,
            estado: true,
            metodoPago: true,
            createdAt: true,
            items: {
              select: {
                cantidad: true,
                precioUnitario: true,
                producto: {
                  select: {
                    id: true,
                    nombre: true,
                    imagenes: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Calcular estadísticas del cliente
    const totalCompras = cliente.pedidos.reduce((sum, p) => sum + p.total, 0);
    const ultimoPedido = cliente.pedidos[0]?.createdAt || null;

    res.json({
      success: true,
      data: {
        ...cliente,
        estadisticas: {
          totalPedidos: cliente.pedidos.length,
          totalGastado: totalCompras,
          ultimoPedido,
          ticketPromedio: cliente.pedidos.length > 0 
            ? totalCompras / cliente.pedidos.length 
            : 0
        }
      }
    });

  } catch (err) {
    console.error('Error obteniendo detalle de cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Actualizar datos del cliente (admin)
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, ruc, activo } = req.body;

    const updateData = {
      ...(nombre && { nombre }),
      ...(email && { email }),
      ...(telefono && { telefono }),
      ...(direccion && { direccion }),
      ...(ruc && { ruc }),
      ...(activo !== undefined && { activo })
    };

    // Verificar email único si se cambia
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id } }
      });
      if (existing) {
        return res.status(400).json({ error: 'Este email ya está registrado' });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        ruc: true,
        activo: true
      }
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: updated
    });

  } catch (err) {
    console.error('Error actualizando cliente:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email ya registrado' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Activar/Desactivar cuenta de cliente
export const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    await prisma.user.update({
      where: { id },
      data: { activo: Boolean(activo) }
    });

    res.json({
      success: true,
      message: `Cuenta ${activo ? 'activada' : 'desactivada'} exitosamente`
    });

  } catch (err) {
    console.error('Error actualizando estado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Exportar clientes a CSV (para reportes)
export const exportCustomers = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const where = {
      rol: 'CLIENTE',
      ...(fechaDesde && { createdAt: { gte: new Date(fechaDesde) } }),
      ...(fechaHasta && { createdAt: { lte: new Date(fechaHasta) } })
    };

    const clientes = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        ruc: true,
        activo: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generar CSV
    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Dirección', 'RUC', 'Estado', 'Fecha Registro'];
    const rows = clientes.map(c => [
      c.id,
      c.nombre,
      c.email,
      c.telefono || '',
      c.direccion || '',
      c.ruc || '',
      c.activo ? 'Activo' : 'Inactivo',
      new Date(c.createdAt).toLocaleDateString('es-PE')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=clientes-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (err) {
    console.error('Error exportando clientes:', err);
    res.status(500).json({ error: 'Error exportando datos' });
  }
};