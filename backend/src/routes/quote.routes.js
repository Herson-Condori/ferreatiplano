// backend/src/routes/quote.routes.js
import { Router } from 'express';
import { 
  calculateQuote, 
  generateQuotePDF, 
  saveQuote 
} from '../controllers/quote.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Rutas públicas
router.post('/calculate', calculateQuote);
router.post('/pdf', generateQuotePDF);

// Ruta protegida para guardar cotización
router.post('/save', verifyToken, saveQuote);

export default router;