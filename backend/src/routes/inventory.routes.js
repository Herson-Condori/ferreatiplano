// backend/src/routes/inventory.routes.js
import { Router } from 'express';
import { 
  getInventory, 
  adjustStock, 
  getInventoryMovements,
  getLowStockAlerts 
} from '../controllers/inventory.controller.js';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN/VENDEDOR
router.use(verifyToken);
router.use(checkRole('ADMIN', 'VENDEDOR'));

router.get('/', getInventory);
router.post('/adjust', adjustStock);
router.get('/movements', getInventoryMovements);
router.get('/alerts', getLowStockAlerts);

export default router;