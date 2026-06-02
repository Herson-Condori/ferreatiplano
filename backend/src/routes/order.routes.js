// backend/src/routes/order.routes.js
import { Router } from 'express';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';
import { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  updateOrderStatus,
  getAllOrders,
  culqiWebhook
} from '../controllers/order.controller.js';

const router = Router();

// ✅ Webhook de Culqi (debe ir antes de las rutas con verifyToken)
router.post('/webhook/culqi', culqiWebhook);

// ✅ Crear pedido
router.post('/', verifyToken, createOrder);

// ✅ Mis pedidos (cliente)
router.get('/my-orders', verifyToken, getMyOrders);

// ✅ Detalle de pedido
router.get('/:id', verifyToken, getOrderById);

// ✅ Actualizar estado (ADMIN/VENDEDOR)
router.patch('/:id/status', verifyToken, checkRole('ADMIN', 'VENDEDOR'), updateOrderStatus);

// ✅ Listar todos los pedidos (ADMIN/VENDEDOR) - SOLO UNA VEZ
router.get('/', verifyToken, checkRole('ADMIN', 'VENDEDOR'), getAllOrders);

export default router;