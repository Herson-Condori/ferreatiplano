// backend/src/controllers/inventory.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Obtener todos los productos con stock
export const getInventory = async (req, res) => {
  try {
    const { categoria, stockBajo, busqueda } = req.query;

    const where = {
      activo: true,
      ...(categoria && categoria !== 'Todos' && { categoria }),
      ...(stockBajo === 'true' && { stock: { lt: 50 } }),
      ...(busqueda && { 
        nombre: { contains: busqueda, mode: 'insensitive' }
      })
    };

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { stock: 'asc' }, // Primero los de menor stock
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        stock: true,
        categoria: true,
        imagenes: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ success: true, data: productos });
  } catch (err) {
    console.error('Error obteniendo inventario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Ajustar stock (aumento/disminución)
export const adjustStock = async (req, res) => {
  try {
    const { productId, cantidad, motivo, tipo } = req.body; // tipo: 'entrada' | 'salida'

    if (!productId || !cantidad || !motivo) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const producto = await prisma.producto.findUnique({
      where: { id: productId }
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const nuevoStock = tipo === 'entrada' 
      ? producto.stock + parseInt(cantidad)
      : producto.stock - parseInt(cantidad);

    if (nuevoStock < 0) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Actualizar stock y crear registro de movimiento
    const [updatedProduct, movimiento] = await prisma.$transaction([
      prisma.producto.update({
        where: { id: productId },
        data: { stock: nuevoStock }
      }),
      prisma.movimientoInventario.create({
        data: {
          productoId: productId,
          tipo, // 'entrada' o 'salida'
          cantidad: parseInt(cantidad),
          stockAnterior: producto.stock,
          stockNuevo: nuevoStock,
          motivo,
          usuarioId: req.user.id // Asumiendo que hay un middleware de auth
        }
      })
    ]);

    res.json({ 
      success: true, 
      message: `Stock ${tipo === 'entrada' ? 'aumentado' : 'disminuido'} correctamente`,
      data: { producto: updatedProduct, movimiento }
    });

  } catch (err) {
    console.error('Error ajustando stock:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Obtener historial de movimientos
export const getInventoryMovements = async (req, res) => {
  try {
    const { productId, fechaDesde, fechaHasta } = req.query;

    const where = {
      ...(productId && { productoId: productId }),
      ...(fechaDesde && { fecha: { gte: new Date(fechaDesde) } }),
      ...(fechaHasta && { fecha: { lte: new Date(fechaHasta) } })
    };

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            imagenes: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 100
    });

    res.json({ success: true, data: movimientos });
  } catch (err) {
    console.error('Error obteniendo movimientos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Obtener alertas de stock bajo
export const getLowStockAlerts = async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 50;

    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        stock: { lt: limite }
      },
      select: {
        id: true,
        nombre: true,
        stock: true,
        categoria: true,
        imagenes: true
      },
      orderBy: { stock: 'asc' }
    });

    res.json({ 
      success: true, 
      data: productos,
      count: productos.length 
    });
  } catch (err) {
    console.error('Error obteniendo alertas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};