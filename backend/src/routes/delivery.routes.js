import { Router } from 'express';
import { 
  calculateDelivery, 
  checkDeliveryZone, 
  getStoreInfo 
} from '../controllers/delivery.controller.js';

const router = Router();

// Rutas públicas
router.post('/calculate', calculateDelivery);
router.get('/check-zone', checkDeliveryZone);
router.get('/store-info', getStoreInfo);

export default router;