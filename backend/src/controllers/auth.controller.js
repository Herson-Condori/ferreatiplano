// backend/src/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🔓 REGISTRO PÚBLICO (solo para CLIENTES)
 * Cualquier persona puede registrarse, pero siempre como CLIENTE
 */
export const register = async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario con rol CLIENTE por defecto (FORZADO para registro público)
    const newUser = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: 'CLIENTE', // 👈 Siempre CLIENTE para registro público
        telefono: telefono || null,
        direccion: direccion || null,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        telefono: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: newUser
    });

  } catch (err) {
    console.error('❌ Error en registro:', err);
    
    // Manejar error de email duplicado (Prisma P2002)
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * 🔐 CREAR USUARIO CON ROL ESPECÍFICO (solo ADMIN)
 * Solo un ADMIN puede crear vendedores o admins desde el panel
 */
export const createUserWithRole = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, direccion } = req.body;

    // Verificar que quien crea es ADMIN
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado para crear este rol' });
    }

    // Validar rol permitido
    if (!['ADMIN', 'VENDEDOR', 'CLIENTE'].includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol, // 👈 Rol definido por ADMIN
        telefono: telefono || null,
        direccion: direccion || null,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        telefono: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: `Usuario ${rol} creado exitosamente`,
      user: newUser
    });

  } catch (err) {
    console.error('❌ Error creando usuario con rol:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * 🔑 LOGIN DE USUARIO
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas o cuenta desactivada' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Respuesta sin password
    const { password: _, ...userWithoutPass } = user;
    
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: userWithoutPass
    });

  } catch (err) {
    console.error('❌ Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * 👤 OBTENER PERFIL DEL USUARIO AUTENTICADO
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        telefono: true,
        direccion: true,
        ruc: true,
        activo: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('❌ Error en getMe:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * 🚪 LOGOUT (client-side: eliminar token)
 */
export const logout = (req, res) => {
  res.json({ success: true, message: 'Logout exitoso' });
};