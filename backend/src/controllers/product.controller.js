import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// 📋 LISTAR PRODUCTOS (con filtros avanzados + paginación + búsqueda)
// ─────────────────────────────────────────────────────────────
export const getProducts = async (req, res) => {
  try {
    const { 
      categoria, 
      busqueda, 
      precioMin, 
      precioMax, 
      stockBajo, 
      page = 1, 
      limit = 12,
      sortBy = 'nombre',
      sortOrder = 'asc'
    } = req.query;

    // Construir filtro WHERE dinámico
    const where = {
      activo: true,
      ...(categoria && categoria !== 'Todos' && { categoria }),
      ...(busqueda && { 
        nombre: { contains: busqueda, mode: 'insensitive' }
      }),
      ...(precioMin && { precio: { gte: parseFloat(precioMin) } }),
      ...(precioMax && { precio: { lte: parseFloat(precioMax) } }),
      ...(stockBajo === 'true' && { stock: { lt: 50 } }),
      ...(stockBajo === 'disponible' && { stock: { gte: 1 } })
    };

    // Validar campos de ordenamiento
    const validSortFields = ['nombre', 'precio', 'stock', 'createdAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
    const orderDir = sortOrder === 'desc' ? 'desc' : 'asc';

    // Paginación
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNumber - 1) * limitNumber;

    // Obtener productos con paginación
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip,
        take: limitNumber,
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio: true,
          stock: true,
          categoria: true,
          imagenes: true,
          activo: true,
          createdAt: true
        }
      }),
      prisma.producto.count({ where })
    ]);

    res.json({
      success: true,
      data: productos,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        hasNext: pageNumber * limitNumber < total,
        hasPrev: pageNumber > 1
      }
    });
  } catch (err) {
    console.error('Error obteniendo productos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// 🔍 OBTENER PRODUCTO POR ID
// ─────────────────────────────────────────────────────────────
export const getProductById = async (req, res) => {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: req.params.id },
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

    if (!producto || !producto.activo) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ success: true, data: producto });
  } catch (err) {
    console.error('Error obteniendo producto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// ➕ CREAR PRODUCTO (acepta imágenes desde Cloudinary o Multer)
// ─────────────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria, activo = true, imagenes } = req.body;
    
    // ✅ VALIDACIÓN DE IMÁGENES - Acepta dos formatos:
    let imagenesArray = [];
    
    // Opción 1: Imágenes ya subidas a Cloudinary (frontend las envía como array de URLs)
    if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
      imagenesArray = imagenes;
    }
    // Opción 2: Imágenes subidas con Multer (req.files)
    else if (req.files && req.files.length > 0) {
      imagenesArray = req.files.map(file => file.path || file.url);
    }
    // Si no hay imágenes de ninguna forma, error
    else {
      return res.status(400).json({ error: 'Se requiere al menos una imagen del producto' });
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion || '',
        precio: parseFloat(precio),
        stock: parseInt(stock),
        categoria,
        activo: Boolean(activo),
        imagenes: imagenesArray // ✅ Array de URLs de Cloudinary
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Producto creado exitosamente',
      data: producto 
    });
  } catch (err) {
    console.error('Error creando producto:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un producto con este nombre' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// ✏️ ACTUALIZAR PRODUCTO (acepta imágenes desde Cloudinary o Multer)
// ─────────────────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria, activo, imagenes } = req.body;
    
    const updateData = {
      ...(nombre && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(precio !== undefined && { precio: parseFloat(precio) }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(categoria && { categoria }),
      ...(activo !== undefined && { activo: Boolean(activo) })
    };

    // ✅ Manejar imágenes: Cloudinary URLs o Multer files
    if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
      // Frontend envió URLs de Cloudinary
      updateData.imagenes = imagenes;
    } else if (req.files && req.files.length > 0) {
      // Multer subió archivos nuevos
      updateData.imagenes = req.files.map(file => file.path || file.url);
    }
    // Si no se envían imágenes, mantener las existentes (no hacer nada)

    const producto = await prisma.producto.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ 
      success: true, 
      message: 'Producto actualizado exitosamente',
      data: producto 
    });
  } catch (err) {
    console.error('Error actualizando producto:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un producto con este nombre' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// 🗑️ ELIMINAR PRODUCTO (Soft Delete)
// ─────────────────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    await prisma.producto.update({
      where: { id: req.params.id },
      data: { activo: false }
    });

    res.json({ success: true, message: 'Producto eliminado exitosamente' });
  } catch (err) {
    console.error('Error eliminando producto:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// 📊 MÉTRICAS DEL DASHBOARD (solo ADMIN)
// ─────────────────────────────────────────────────────────────
export const getDashboardMetrics = async (req, res) => {
  try {
    const totalProductos = await prisma.producto.count({ where: { activo: true } });
    const stockBajo = await prisma.producto.count({ 
      where: { activo: true, stock: { lt: 50 } } 
    });
    const totalPedidos = await prisma.pedido.count();
    const pedidosPendientes = await prisma.pedido.count({
      where: { estado: 'NUEVO' }
    });

    const ventasTotales = await prisma.pedido.aggregate({
      _sum: { total: true },
      where: { estado: { in: ['ENTREGADO', 'EN_CAMINO'] } }
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ventasHoy = await prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: hoy },
        estado: { in: ['ENTREGADO', 'EN_CAMINO', 'NUEVO'] }
      }
    });

    const productosMasVendidos = await prisma.pedidoItem.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5
    });

    const productosTop = await Promise.all(
      productosMasVendidos.map(async (item) => {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId },
          select: { id: true, nombre: true, precio: true, categoria: true }
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
        totalProductos,
        stockBajo,
        totalPedidos,
        pedidosPendientes,
        ventasTotales: ventasTotales._sum.total || 0,
        ventasHoy: ventasHoy._sum.total || 0,
        productosTop: productosTop.filter(p => p) // Filtrar nulls
      }
    });
  } catch (err) {
    console.error('Error obteniendo métricas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// 🏷️ OBTENER CATEGORÍAS DISPONIBLES (NUEVO - para filtros)
// ─────────────────────────────────────────────────────────────
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.producto.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ['categoria']
    });

    res.json({
      success: true,
      data: categories.map(c => c.categoria).filter(Boolean).sort()
    });
  } catch (err) {
    console.error('Error obteniendo categorías:', err);
    res.status(500).json({ error: 'Error obteniendo categorías' });
  }
};

// ─────────────────────────────────────────────────────────────
// 💰 OBTENER RANGO DE PRECIOS (NUEVO - para filtros)
// ─────────────────────────────────────────────────────────────
export const getPriceRange = async (req, res) => {
  try {
    const range = await prisma.producto.aggregate({
      _min: { precio: true },
      _max: { precio: true },
      where: { activo: true }
    });

    res.json({
      success: true,
      data: {
        min: range._min.precio ? parseFloat(range._min.precio) : 0,
        max: range._max.precio ? parseFloat(range._max.precio) : 1000
      }
    });
  } catch (err) {
    console.error('Error obteniendo rango de precios:', err);
    res.status(500).json({ error: 'Error obteniendo rango de precios' });
  }
};