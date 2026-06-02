// backend/src/routes/report.routes.js
import { Router } from 'express';
import { getSalesReport, getOrderHistory } from '../controllers/report.controller.js';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Solo ADMIN
router.use(verifyToken);
router.use(checkRole('ADMIN'));

router.get('/sales', getSalesReport);
router.get('/history', getOrderHistory);

export default router;