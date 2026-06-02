// backend/src/routes/vendor.routes.js
import { Router } from 'express';
import { 
  createVendor, 
  getVendors, 
  updateVendor,
  toggleVendorStatus 
} from '../controllers/vendor.controller.js';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Solo ADMIN puede gestionar vendedores
router.use(verifyToken);
router.use(checkRole('ADMIN'));

router.post('/', createVendor);
router.get('/', getVendors);
router.put('/:id', updateVendor);
router.patch('/:id/status', toggleVendorStatus);

export default router;