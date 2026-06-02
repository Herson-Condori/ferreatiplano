// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  logout,
  createUserWithRole 
} from '../controllers/auth.controller.js';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// 🔓 RUTAS PÚBLICAS (sin autenticación)
// ─────────────────────────────────────────────────────────────

// Registro público (siempre crea rol CLIENTE)
router.post('/register', register);

// Login
router.post('/login', login);

// ─────────────────────────────────────────────────────────────
// 🔐 RUTAS PROTEGIDAS (requieren token JWT)
// ─────────────────────────────────────────────────────────────

// Obtener perfil del usuario autenticado
router.get('/me', verifyToken, getMe);

// Logout (aunque es client-side, mantenemos la ruta para consistencia)
router.post('/logout', verifyToken, logout);

// ─────────────────────────────────────────────────────────────
// 👑 RUTAS SOLO ADMIN (gestión de usuarios)
// ─────────────────────────────────────────────────────────────

// Crear usuario con rol específico (solo ADMIN)
router.post('/create-user', 
  verifyToken, 
  checkRole('ADMIN'), 
  createUserWithRole
);

// Ejemplo: Crear vendedor (solo ADMIN)
router.post('/create-vendedor', 
  verifyToken, 
  checkRole('ADMIN'), 
  (req, res, next) => {
    req.body.rol = 'VENDEDOR';
    next();
  },
  createUserWithRole
);

// Ejemplo: Crear admin (solo ADMIN)
router.post('/create-admin', 
  verifyToken, 
  checkRole('ADMIN'), 
  (req, res, next) => {
    req.body.rol = 'ADMIN';
    next();
  },
  createUserWithRole
);

export default router;