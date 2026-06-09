// backend/src/controllers/quote.controller.js
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { 
  calculateMaterials, 
  calculateCosts, 
  generateQuoteSummary 
} from '../services/calculator.service.js';

const prisma = new PrismaClient();

/**
 * Calcular cotización de proyecto
 */
export const calculateQuote = async (req, res) => {
  try {
    const { projectType, measurements, clientInfo } = req.body;

    // Validar tipo de proyecto
    const validTypes = ['pared_ladrillo', 'columna', 'losa_aligerada', 'tarrajeo', 'concreto_simple'];
    if (!validTypes.includes(projectType)) {
      return res.status(400).json({ error: 'Tipo de proyecto no válido' });
    }

    // Calcular materiales
    const materialsResult = calculateMaterials(projectType, measurements);

    // Calcular costos con precios de BD
    const withCosts = await calculateCosts(materialsResult, prisma);

    // Generar resumen
    const summary = generateQuoteSummary(withCosts, clientInfo || {});

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error calculando cotización:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Generar PDF de cotización
 */
export const generateQuotePDF = async (req, res) => {
  try {
    const { quoteData } = req.body;

    // Crear documento PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: `Cotización ${quoteData.quoteId}`,
        Author: 'Construmax Juliaca',
        Subject: 'Cotización de materiales de construcción'
      }
    });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${quoteData.quoteId}.pdf`);

    // Pipe a response
    doc.pipe(res);

    // ─────────────────────────────────────────────────────────────
    // 🎨 DISEÑO DEL PDF
    // ─────────────────────────────────────────────────────────────

    // Header con logo y datos de empresa
    doc.fontSize(18).font('Helvetica-Bold').text('CONSTRUMAX', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Materiales de Construcción', { align: 'center' });
    doc.text('Av. Ilave 1234, Juliaca - Puno, Perú', { align: 'center' });
    doc.text('📞 +51 942 318 219 | ✉️ ventas@construmax.pe', { align: 'center' });
    
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Datos de la cotización
    doc.fontSize(12).font('Helvetica-Bold').text(`COTIZACIÓN N° ${quoteData.quoteId}`);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Fecha: ${new Date(quoteData.generatedAt).toLocaleDateString('es-PE')}`);
    doc.text(`Cliente: ${quoteData.client.nombre || 'Cliente General'}`);
    if (quoteData.client.telefono) doc.text(`Teléfono: ${quoteData.client.telefono}`);
    if (quoteData.client.direccion) doc.text(`Dirección: ${quoteData.client.direccion}`);
    
    doc.moveDown();

    // Detalles del proyecto
    doc.font('Helvetica-Bold').fontSize(10).text('DETALLES DEL PROYECTO:');
    doc.font('Helvetica').fontSize(9);
    doc.text(`Tipo: ${getProjectTypeName(quoteData.project.type)}`);
    doc.text(`Cantidad: ${quoteData.project.quantity} ${quoteData.project.unit}`);
    doc.text(`Desperdicio incluido: ${quoteData.project.wasteFactor || 10}%`);
    
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Tabla de materiales
    doc.font('Helvetica-Bold').fontSize(9).text('MATERIALES REQUERIDOS:', { underline: true });
    doc.moveDown(0.5);

    // Headers de tabla
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('Producto', 50, tableTop, { width: 250 });
    doc.text('Cant.', 300, tableTop, { width: 60, align: 'right' });
    doc.text('Unidad', 360, tableTop, { width: 70 });
    doc.text('P.Unit', 430, tableTop, { width: 60, align: 'right' });
    doc.text('Subtotal', 490, tableTop, { width: 60, align: 'right' });
    
    doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();

    // Filas de materiales
    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    for (const [key, mat] of Object.entries(quoteData.materials)) {
      if (rowY > 700) { // Nueva página si se acaba el espacio
        doc.addPage();
        rowY = 50;
      }

      const name = mat.estimated ? `${mat.name}*` : mat.name;
      doc.text(name, 50, rowY, { width: 250 });
      doc.text(mat.quantity.toFixed(2), 300, rowY, { width: 60, align: 'right' });
      doc.text(mat.unit.split('/')[0], 360, rowY, { width: 70 });
      doc.text(`S/ ${mat.unitPrice.toFixed(2)}`, 430, rowY, { width: 60, align: 'right' });
      doc.text(`S/ ${mat.subtotal.toFixed(2)}`, 490, rowY, { width: 60, align: 'right' });

      rowY += 15;
    }

    // Totales
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);
    doc.text('Subtotal:', 400, doc.y, { width: 90, align: 'right' });
    doc.text(`S/ ${quoteData.totals.subtotal.toFixed(2)}`, 490, doc.y, { width: 60, align: 'right' });
    doc.moveDown(0.8);
    
    doc.text('IGV (18%):', 400, doc.y, { width: 90, align: 'right' });
    doc.text(`S/ ${quoteData.totals.igv.toFixed(2)}`, 490, doc.y, { width: 60, align: 'right' });
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').fontSize(11);
    doc.fillColor('#E8A020').text('TOTAL:', 400, doc.y, { width: 90, align: 'right' });
    doc.text(`S/ ${quoteData.totals.total.toFixed(2)}`, 490, doc.y, { width: 60, align: 'right' });
    doc.fillColor('#000000');

    // Footer con notas
    doc.moveDown(2);
    doc.font('Helvetica-Oblique').fontSize(7).fillColor('#666');
    doc.text('NOTAS:', 50, doc.y);
    doc.font('Helvetica').fontSize(6);
    quoteData.notes.forEach(note => {
      doc.text(`• ${note}`, 50, doc.y, { width: 500 });
      doc.moveDown(0.3);
    });
    
    doc.moveDown(1);
    doc.text('* Precios estimados - Consultar disponibilidad en tienda', 50, doc.y);
    
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#E8A020');
    doc.text('¡Gracias por confiar en Construmax!', { align: 'center' });

    // Finalizar PDF
    doc.end();

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
};

/**
 * Guardar cotización en BD (opcional)
 */
export const saveQuote = async (req, res) => {
  try {
    const { quoteData, clienteId } = req.body;

    const saved = await prisma.cotizacion.create({
      data: {
        clienteId: clienteId || null,
        quoteId: quoteData.quoteId,
        projectType: quoteData.project.type,
        quantity: quoteData.project.quantity,
        unit: quoteData.project.unit,
        totalCost: quoteData.totals.total,
        materials: quoteData.materials,
        pdfUrl: `/quotes/${quoteData.quoteId}.pdf`,
        status: 'PENDIENTE'
      }
    });

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error guardando cotización:', error);
    res.status(500).json({ error: 'Error guardando cotización' });
  }
};

// Helper: Nombre legible del tipo de proyecto
const getProjectTypeName = (type) => {
  const names = {
    'pared_ladrillo': 'Pared de Ladrillo King Kong',
    'columna': 'Columna de Concreto Armado',
    'losa_aligerada': 'Losa Aligerada',
    'tarrajeo': 'Tarrajeo de Pared',
    'concreto_simple': 'Concreto Simple para Cimentación'
  };
  return names[type] || type;
};