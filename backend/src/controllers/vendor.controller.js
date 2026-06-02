// backend/src/controllers/vendor.controller.js
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Crear nuevo vendedor (solo ADMIN)
export const createVendor = async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);

    const vendor = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashed,
        rol: 'VENDEDOR',
        telefono,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Vendedor creado exitosamente',
      data: vendor
    });

  } catch (err) {
    console.error('Error creando vendedor:', err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email duplicado' });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Obtener lista de vendedores
export const getVendors = async (req, res) => {
  try {
    const { busqueda, estado } = req.query;

    const where = {
      rol: 'VENDEDOR',
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { email: { contains: busqueda, mode: 'insensitive' } }
        ]
      }),
      ...(estado && { activo: estado === 'activo' })
    };

    // Obtener vendedores con conteo de pedidos asignados (opcional, si hay relación)
    const vendors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        activo: true,
        createdAt: true,
        _count: {
          select: { pedidosAsignados: true } // Asegúrate de tener esta relación en Prisma o quitarlo
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: vendors });
  } catch (err) {
    console.error('Error obteniendo vendedores:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Actualizar datos de vendedor
export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono } = req.body;

    const updateData = { nombre, telefono };
    
    // Validar email único si se cambia
    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (existing) return res.status(400).json({ error: 'Email ya registrado' });
      updateData.email = email;
    }

    const updated = await prisma.user.update({
      where: { id, rol: 'VENDEDOR' },
      data: updateData,
      select: { id: true, nombre: true, email: true, telefono: true, activo: true }
    });

    res.json({ success: true, message: 'Vendedor actualizado', data: updated });
  } catch (err) {
    console.error('Error actualizando vendedor:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ Activar/Desactivar vendedor
export const toggleVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    await prisma.user.update({
      where: { id, rol: 'VENDEDOR' },
      data: { activo: Boolean(activo) }
    });

    res.json({ success: true, message: `Estado actualizado a ${activo ? 'Activo' : 'Inactivo'}` });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
};