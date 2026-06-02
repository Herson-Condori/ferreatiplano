// backend/src/routes/customer.routes.js
import { Router } from 'express';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';
import {
  getCustomers,
  getCustomerDetail,
  updateCustomer,
  toggleCustomerStatus,
  exportCustomers
} from '../controllers/customer.controller.js';

const router = Router();

router.get('/', verifyToken, checkRole('ADMIN'), getCustomers);
router.get('/export', verifyToken, checkRole('ADMIN'), exportCustomers);
router.get('/:id', verifyToken, getCustomerDetail);
router.put('/:id', verifyToken, checkRole('ADMIN'), updateCustomer);
router.patch('/:id/status', verifyToken, checkRole('ADMIN'), toggleCustomerStatus);

export default router;