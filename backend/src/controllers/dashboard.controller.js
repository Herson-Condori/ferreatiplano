// backend/src/controllers/dashboard.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getVendorStats = async (req, res) => {
  try {
    const { rol } = req.user;
    
    // Obtener fecha de hoy (inicio y fin del día)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Filtro base: solo pedidos de hoy
    const filtroHoy = {
      createdAt: {
        gte: hoy,
        lt: manana
      }
    };

    // Si es vendedor, ver sus pedidos + online; si es admin, todos
    const filtroRol = rol === 'VENDEDOR' 
      ? { 
          ...filtroHoy, 
          OR: [
            { vendedorId: req.user.id },
            { vendedorId: null }
          ]
        }
      : filtroHoy;

    // 1. Ventas de hoy (total monetario)
    const ventasHoyResult = await prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        ...filtroRol,
        estado: {
          in: ['ENTREGADO', 'EN_CAMINO', 'EN_PREPARACION'] // Pedidos confirmados
        }
      }
    });
    const ventasHoy = ventasHoyResult._sum.total || 0;

    // 2. Pedidos de hoy (cantidad)
    const pedidosHoyCount = await prisma.pedido.count({
      where: filtroRol
    });

    // 3. Ticket promedio (ventas totales / cantidad de pedidos)
    const ticketPromedio = pedidosHoyCount > 0 
      ? ventasHoy / pedidosHoyCount 
      : 0;

    // 4. Clientes atendidos (clientes únicos)
    const clientesAtendidos = await prisma.pedido.groupBy({
      by: ['clienteId'],
      where: filtroRol
    });

    res.json({
      success: true,
      data: {
        ventasHoy: parseFloat(ventasHoy),
        pedidosHoy: pedidosHoyCount,
        ticketPromedio: parseFloat(ticketPromedio),
        clientesAtendidos: clientesAtendidos.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const { rol } = req.user;

    const filtroRol = rol === 'VENDEDOR'
      ? { 
          OR: [
            { vendedorId: req.user.id },
            { vendedorId: null }
          ]
        }
      : {};

    const pedidos = await prisma.pedido.findMany({
      where: {
        ...filtroRol,
        estado: 'NUEVO'
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            email: true,
            telefono: true
          }
        },
        items: {
          include: {
            producto: {
              select: {
                nombre: true,
                precio: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    console.error('Error obteniendo pedidos pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};