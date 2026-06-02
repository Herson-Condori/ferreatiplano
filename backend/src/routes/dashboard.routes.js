// backend/src/routes/dashboard.routes.js
import { Router } from 'express';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';
import { getVendorStats, getPendingOrders } from '../controllers/dashboard.controller.js';

const router = Router();

// Estadísticas del dashboard (para ADMIN y VENDEDOR)
router.get('/stats', verifyToken, checkRole(['ADMIN', 'VENDEDOR']), getVendorStats);

// Pedidos pendientes
router.get('/pending-orders', verifyToken, checkRole(['ADMIN', 'VENDEDOR']), getPendingOrders);

export default router;