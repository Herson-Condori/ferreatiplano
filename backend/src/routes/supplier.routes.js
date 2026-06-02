import { Router } from 'express';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';
import { getSuppliers, createSupplier, updateSupplier, toggleSupplierStatus } from '../controllers/supplier.controller.js';

const router = Router();
router.use(verifyToken, checkRole('ADMIN'));

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.patch('/:id/status', toggleSupplierStatus);

export default router;