// backend/src/controllers/supplier.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getSuppliers = async (req, res) => {
  try {
    const { busqueda, estado } = req.query;
    const where = {
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { contacto: { contains: busqueda, mode: 'insensitive' } },
          { email: { contains: busqueda, mode: 'insensitive' } }
        ]
      }),
      ...(estado && { activo: estado === 'activo' })
    };

    const proveedores = await prisma.proveedor.findMany({
      where,
      select: {
        id: true, nombre: true, ruc: true, contacto: true, 
        email: true, telefono: true, direccion: true, 
        productosSuministra: true, activo: true, createdAt: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({ success: true, data: proveedores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { nombre, ruc, contacto, email, telefono, direccion, productosSuministra } = req.body;
    const proveedor = await prisma.proveedor.create({
      data: { nombre, ruc, contacto, email, telefono, direccion, productosSuministra: productosSuministra || '' }
    });
    res.status(201).json({ success: true, data: proveedor });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.proveedor.update({ where: { id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const toggleSupplierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    await prisma.proveedor.update({ where: { id }, data: { activo: Boolean(activo) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
};