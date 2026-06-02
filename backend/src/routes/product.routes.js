import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';

// Importar todas las funciones del controller
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getDashboardMetrics,
  getCategories,
  getPriceRange
} from '../controllers/product.controller.js';

const router = Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// 🌐 RUTAS PÚBLICAS (ESPECÍFICAS PRIMERO)
// ─────────────────────────────────────────────────────────────

// ✅ ESTAS VAN PRIMERO (rutas específicas)
router.get('/categories', getCategories);
router.get('/price-range', getPriceRange);

// ✅ LUEGO las rutas generales
router.get('/', getProducts);

// ─────────────────────────────────────────────────────────────
// 🔐 RUTAS PROTEGIDAS (ESPECÍFICAS PRIMERO)
// ─────────────────────────────────────────────────────────────

// ✅ Métricas del dashboard (antes de /:id)
router.get('/admin/metrics', 
  verifyToken, 
  checkRole('ADMIN'), 
  getDashboardMetrics
);

// ✅ Rutas con upload de imágenes
router.post('/', 
  verifyToken, 
  checkRole('ADMIN', 'VENDEDOR'), 
  upload.array('imagenes', 5),
  createProduct
);

router.put('/:id', 
  verifyToken, 
  checkRole('ADMIN', 'VENDEDOR'), 
  upload.array('imagenes', 5),
  updateProduct
);

// ✅ DELETE
router.delete('/:id', 
  verifyToken, 
  checkRole('ADMIN'),
  deleteProduct
);

// ⚠️ ESTA VA AL FINAL (ruta genérica que captura cualquier ID)
router.get('/:id', getProductById);

export default router;