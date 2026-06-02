// backend/src/controllers/report.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Obtener reporte de ventas y métricas por rango de fechas
export const getSalesReport = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    // Construir filtro de fechas
    const where = {};
    if (fechaInicio) where.createdAt = { gte: new Date(fechaInicio) };
    if (fechaFin) where.createdAt = { ...where.createdAt, lte: new Date(fechaFin) };

    // 1. Totales Generales
    const totals = await prisma.pedido.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where
    });

    // 2. Ventas por Método de Pago
    const payments = await prisma.pedido.groupBy({
      by: ['metodoPago'],
      _sum: { total: true },
      _count: { id: true },
      where
    });

    // 3. Productos Más Vendidos (Top 5)
    const topProducts = await prisma.pedidoItem.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true },
      where,
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5
    });

    // Enriquecer con detalles del producto
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId },
          select: { id: true, nombre: true, categoria: true, imagenes: true }
        });
        
        return {
          ...producto,
          cantidadVendida: item._sum.cantidad
        };
      })
    );

    res.json({
      success: true,
      data: {
        resumen: {
          totalVentas: totals._sum.total || 0,
          totalPedidos: totals._count.id || 0,
          ticketPromedio: totals._count.id ? (totals._sum.total / totals._count.id) : 0
        },
        porMetodoPago: payments,
        productosTop: topProductsWithDetails
      }
    });

  } catch (err) {
    console.error('Error generando reporte:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Obtener historial detallado de pedidos (para tabla de reportes)
export const getOrderHistory = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (fechaInicio) where.createdAt = { gte: new Date(fechaInicio) };
    if (fechaFin) where.createdAt = { ...where.createdAt, lte: new Date(fechaFin) };

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { nombre: true, email: true } },
        items: { 
          select: { cantidad: true, precioUnitario: true, producto: { select: { nombre: true } } } 
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNumber
    });

    const total = await prisma.pedido.count({ where });

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
    res.status(500).json({ error: 'Error interno' });
  }
};