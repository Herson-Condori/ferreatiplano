// backend/src/index.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Middlewares de auth
import { verifyToken, checkRole } from './middleware/auth.middleware.js';

// Rutas
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import quoteRoutes from './routes/quote.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import customerRoutes from './routes/customer.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import reportRoutes from './routes/report.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { verifyCloudinaryConnection } from './config/cloudinary.js';

// ─────────────────────────────────────────────────────────────
// ⚙️ CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────────────────────
// 🔐 MIDDLEWARES GLOBALES
// ─────────────────────────────────────────────────────────────

// Seguridad HTTP headers
app.use(helmet());

// Logging de peticiones (modo desarrollo)
app.use(morgan('dev'));

// CORS: Permitir conexión desde frontend (desarrollo + producción)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parsear JSON y formularios
app.use(express.json({ limit: '10mb' }));
app.use('/api/upload', uploadRoutes);
app.use(express.urlencoded({ extended: true }));

verifyCloudinaryConnection();

// ─────────────────────────────────────────────────────────────
// 🌐 RUTAS PÚBLICAS
// ─────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Ferrealtiplano API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Rutas de autenticación (públicas)
app.use('/api/auth', authRoutes);

// Rutas de productos (públicas para catálogo)
app.use('/api/products', productRoutes);

app.use('/api/dashboard', dashboardRoutes);

// Rutas de cotizaciones (públicas)
app.use('/api/quotes', quoteRoutes);

// Rutas de delivery (públicas para cálculo)
app.use('/api/delivery', deliveryRoutes);

// ─────────────────────────────────────────────────────────────
// 🔐 RUTAS PROTEGIDAS (requieren token JWT)
// ─────────────────────────────────────────────────────────────

// Pedidos (cliente logueado)
app.use('/api/orders', orderRoutes);

app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suppliers', supplierRoutes);

// Facturas/Comprobantes (cliente logueado + admin)
app.use('/api/invoices', invoiceRoutes);

// Dashboard Admin (solo ADMIN)
app.get('/api/admin/dashboard', 
  verifyToken, 
  checkRole('ADMIN'), 
  (req, res) => {
    res.json({ 
      message: 'Bienvenido al Dashboard Admin',
      user: {
        id: req.user.id,
        email: req.user.email,
        rol: req.user.rol
      },
      metrics: {
        ventasHoy: 1250.50,
        pedidosPendientes: 8,
        productosStockBajo: 3,
        totalUsuarios: 142
      }
    });
  }
);

// Panel Vendedor (ADMIN o VENDEDOR)
app.get('/api/vendedor/pedidos', 
  verifyToken, 
  checkRole('ADMIN', 'VENDEDOR'), 
  (req, res) => {
    res.json({ 
      message: 'Pedidos asignados al vendedor',
      pedidos: []
    });
  }
);

// Perfil del usuario autenticado
app.get('/api/users/me', 
  verifyToken, 
  (req, res) => {
    res.json({ 
      message: 'Datos del usuario autenticado',
      userId: req.user.id,
      rol: req.user.rol
    });
  }
);

// ─────────────────────────────────────────────────────────────
// ❌ MANEJO DE ERRORES (DEBE IR ANTES DEL 404)
// ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  
  // Errores conocidos de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Registro duplicado' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Recurso no encontrado' });
  }
  
  // Respuesta genérica
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Error interno del servidor'
  });
});

// ─────────────────────────────────────────────────────────────
// 🕳️ 404 - CATCH-ALL
// ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// ─────────────────────────────────────────────────────────────
// 🚀 INICIAR SERVIDOR
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Ferrealtiplano API corriendo en http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS permitido desde: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

// Cierre elegante
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando conexiones...');
  process.exit(0);
});