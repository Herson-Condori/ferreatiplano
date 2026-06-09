import { Router } from 'express';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';
import { 
  generateInvoice, 
  checkInvoiceStatus, 
  cancelInvoice 
} from '../services/invoice.service.js';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const INVOICES_DIR = path.join(__dirname, '../../invoices');

// Descargar PDF del comprobante
router.get('/:pedidoId/download', verifyToken, async (req, res) => {
  try {
    const comprobante = await prisma.comprobante.findUnique({
      where: { pedidoId: req.params.pedidoId }
    });

    if (!comprobante) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    // Verificar que el usuario tenga permiso
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.pedidoId },
      select: { clienteId: true }
    });

    if (pedido.clienteId !== req.user.id && req.user.rol !== 'ADMIN' && req.user.rol !== 'VENDEDOR') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Buscar PDF local
    const pdfPath = path.join(INVOICES_DIR, `${req.params.pedidoId}.pdf`);
    
    if (fs.existsSync(pdfPath)) {
      res.download(pdfPath, `${comprobante.serie}-${comprobante.numero}.pdf`);
    } else if (comprobante.pdfUrl) {
      // Redirigir a URL de Nubefact
      res.redirect(comprobante.pdfUrl);
    } else {
      res.status(404).json({ error: 'PDF no disponible' });
    }
  } catch (error) {
    console.error('Error descargando comprobante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Consultar estado en SUNAT (solo ADMIN)
router.get('/:serie/:numero/status', verifyToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const status = await checkInvoiceStatus(req.params.serie, req.params.numero);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Anular comprobante (solo ADMIN)
router.post('/:pedidoId/cancel', verifyToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const { motivo } = req.body;
    const result = await cancelInvoice(req.params.pedidoId, motivo);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reintentar generación de comprobante (solo ADMIN)
router.post('/:pedidoId/generate', verifyToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.pedidoId },
      include: { 
        items: { include: { producto: true } },
        cliente: true
      }
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const result = await generateInvoice(pedido);
    
    if (result.success) {
      res.json({ success: true, data: result.comprobante });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;