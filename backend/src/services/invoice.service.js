import nubefactClient from '../config/nubefact.js';
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear carpeta para comprobantes si no existe
const INVOICES_DIR = path.join(__dirname, '../../invoices');
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

/**
 * Generar un PDF local en formato A4 para el comprobante
 */
export const generateLocalPDF = (pedido, comprobante, pdfPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `${comprobante.tipo} ${comprobante.serie}-${comprobante.numero.toString().padStart(8, '0')}`,
          Author: 'Ferrealtiplano',
          Subject: 'Comprobante Electrónico'
        }
      });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // --- LOGO Y DATOS DE LA EMPRESA ---
      doc.rect(40, 40, 300, 95).strokeColor('#2E2B24').lineWidth(1).stroke();
      
      // Nombre de Empresa
      doc.fillColor('#E8A020').font('Helvetica-Bold').fontSize(22);
      doc.text('FERREALTIPLANO', 55, 55);
      
      // Detalle Empresa
      doc.fillColor('#1A1916').font('Helvetica').fontSize(9);
      doc.text('Comercialización de materiales de construcción', 55, 80);
      doc.text('Av. Ilave 1234, Juliaca - Puno, Perú', 55, 95);
      doc.text('Celular: +51 942 318 219 | ventas@ferrealtiplano.pe', 55, 110);

      // --- CAJA DE COMPROBANTE (RUC, TIPO, NÚMERO) ---
      doc.rect(360, 40, 195, 95).fillColor('#F5F3ED').strokeColor('#E8A020').lineWidth(2).fillAndStroke();
      
      doc.fillColor('#1A1916').font('Helvetica-Bold').fontSize(12);
      doc.text('R.U.C. 20601234567', 370, 52, { width: 175, align: 'center' });
      
      doc.fillColor('#C67A13').fontSize(10);
      doc.text(
        comprobante.tipo === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA',
        370, 72, 
        { width: 175, align: 'center' }
      );
      
      doc.fillColor('#1A1916').fontSize(14);
      doc.text(
        `${comprobante.serie}-${comprobante.numero.toString().padStart(8, '0')}`,
        370, 98,
        { width: 175, align: 'center' }
      );

      // Reset text y stroke
      doc.fillColor('#1A1916').strokeColor('#2E2B24');

      // --- INFORMACIÓN DEL CLIENTE Y FECHA ---
      doc.y = 155;
      doc.x = 40;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#C67A13').text('DATOS DEL ADQUIRIENTE:');
      doc.moveTo(40, 170).lineTo(555, 170).lineWidth(1).strokeColor('#2E2B24').stroke();
      
      doc.font('Helvetica').fontSize(9).fillColor('#1A1916');
      doc.y = 180;
      
      const clientName = pedido.cliente?.nombre || 'Público General';
      const clientDoc = comprobante.tipo === 'FACTURA' 
        ? `RUC: ${pedido.cliente?.ruc || '00000000000'}` 
        : `DNI: ${pedido.cliente?.ruc || '00000000'}`;
      const clientAddr = pedido.direccionEntrega || 'Dirección no registrada';
      const emitDate = new Date(comprobante.createdAt).toLocaleDateString('es-PE');
      const payMethod = pedido.metodoPago || 'Efectivo / Transferencia';

      doc.text(`Cliente: ${clientName}`, 45, 180);
      doc.text(`Documento: ${clientDoc}`, 45, 195);
      doc.text(`Dirección: ${clientAddr}`, 45, 210, { width: 320 });

      doc.text(`Fecha Emisión: ${emitDate}`, 380, 180);
      doc.text(`Moneda: SOLES (S/)`, 380, 195);
      doc.text(`Método de Pago: ${payMethod}`, 380, 210);

      // --- TABLA DE DETALLES ---
      const tableTop = 245;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#C67A13');
      
      // Encabezados
      doc.text('CANT.', 45, tableTop, { width: 40 });
      doc.text('DESCRIPCIÓN', 95, tableTop, { width: 270 });
      doc.text('UND.', 375, tableTop, { width: 35 });
      doc.text('P. UNIT', 420, tableTop, { width: 60, align: 'right' });
      doc.text('TOTAL', 490, tableTop, { width: 65, align: 'right' });

      doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).strokeColor('#2E2B24').stroke();

      // Filas
      let y = tableTop + 23;
      doc.font('Helvetica').fontSize(9).fillColor('#1A1916');
      
      const items = pedido.items || [];
      items.forEach(item => {
        const cant = item.cantidad;
        const desc = item.producto?.nombre || 'Producto';
        const price = Number(item.precioUnitario);
        const rowTotal = price * cant;

        doc.text(cant.toString(), 45, y);
        doc.text(desc, 95, y, { width: 270 });
        doc.text('UNI', 375, y);
        doc.text(`S/ ${price.toFixed(2)}`, 420, y, { width: 60, align: 'right' });
        doc.text(`S/ ${rowTotal.toFixed(2)}`, 490, y, { width: 65, align: 'right' });

        y += 18;
      });

      // Agregar Delivery como una fila más si existe y es mayor a 0
      const delivery = Number(pedido.costoDelivery || 0);
      if (delivery > 0) {
        doc.text('1', 45, y);
        doc.text('Costo de envío / Delivery', 95, y, { width: 270 });
        doc.text('UNI', 375, y);
        doc.text(`S/ ${delivery.toFixed(2)}`, 420, y, { width: 60, align: 'right' });
        doc.text(`S/ ${delivery.toFixed(2)}`, 490, y, { width: 65, align: 'right' });
        y += 18;
      }

      doc.moveTo(40, y).lineTo(555, y).stroke();
      y += 10;

      // --- CÁLCULO DE TOTALES ---
      const totalVal = Number(pedido.total);
      const subtotalVal = totalVal / 1.18;
      const igvVal = totalVal - subtotalVal;

      doc.text('OP. GRAVADA:', 360, y, { width: 110, align: 'right' });
      doc.text(`S/ ${subtotalVal.toFixed(2)}`, 480, y, { width: 75, align: 'right' });
      y += 14;

      doc.text('I.G.V. (18%):', 360, y, { width: 110, align: 'right' });
      doc.text(`S/ ${igvVal.toFixed(2)}`, 480, y, { width: 75, align: 'right' });
      y += 14;

      doc.font('Helvetica-Bold').fillColor('#E8A020');
      doc.text('IMPORTE TOTAL:', 360, y, { width: 110, align: 'right' });
      doc.text(`S/ ${totalVal.toFixed(2)}`, 480, y, { width: 75, align: 'right' });

      // --- PIE DE PÁGINA / HASH ---
      doc.fillColor('#1A1916');
      y += 35;
      doc.font('Helvetica').fontSize(7.5);
      doc.text(`Código Hash SUNAT: ${comprobante.sunatHash || 'No disponible'}`, 45, y);
      doc.text('Representación impresa del Comprobante de Pago Electrónico.', 45, y + 10);
      doc.text('Este documento puede ser consultado en la página web de la SUNAT.', 45, y + 20);
      
      doc.font('Helvetica-Bold').fillColor('#C67A13').fontSize(9);
      doc.text('¡Gracias por su compra en Ferrealtiplano!', 45, y + 35, { align: 'center' });

      doc.end();
      
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generar comprobante electrónico (Boleta o Factura)
 */
export const generateInvoice = async (pedido, tipoForzado) => {
  try {
    // Determinar tipo de comprobante
    const esFactura = tipoForzado ? (tipoForzado.toUpperCase() === 'FACTURA') : (pedido.cliente?.ruc && pedido.cliente.ruc.length === 11);
    const tipoComprobante = esFactura ? 'factura' : 'boleta';

    // Validación de RUC para Factura
    if (esFactura && (!pedido.cliente?.ruc || pedido.cliente.ruc.length !== 11)) {
      throw new Error('Para emitir una FACTURA se requiere un RUC válido de 11 dígitos en el perfil del cliente.');
    }

    // Preparar items para Nubefact
    const items = pedido.items.map((item, index) => ({
      cod_producto: item.producto.id,
      descripcion: item.producto.nombre,
      cantidad: item.cantidad,
      precio_unitario: parseFloat(item.precioUnitario),
      precio_total: parseFloat(item.precioUnitario * item.cantidad),
      tipo_igv: '1', // IGV incluido
      porcentaje_igv: 18,
      valor_unitario: parseFloat((item.precioUnitario / 1.18).toFixed(2)),
      igv: parseFloat((item.precioUnitario - (item.precioUnitario / 1.18)).toFixed(2)),
      tipo: '01', // Producto
      unidad: 'NIU' // Unidad internacional
    }));

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.valor_unitario * item.cantidad, 0);
    const igv = items.reduce((sum, item) => sum + item.igv * item.cantidad, 0);
    const total = parseFloat(pedido.total);

    // Datos del cliente
    const clienteData = {
      tipo_doc: esFactura ? '6' : '1', // 6 = RUC, 1 = DNI
      num_doc: esFactura ? pedido.cliente.ruc : '00000000', // Si no hay DNI, usar genérico
      rzn_social: pedido.cliente?.nombre || 'Cliente General',
      direccion: pedido.direccionEntrega || 'Dirección no registrada'
    };

    // Payload para Nubefact
    const invoicePayload = {
      tipo_doc: tipoComprobante === 'factura' ? '01' : '03', // 01 = Factura, 03 = Boleta
      serie: tipoComprobante === 'factura' ? 'F001' : 'B001',
      correlativo: await getNextCorrelativo(tipoComprobante),
      fecha_emision: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      hora_emision: new Date().toLocaleTimeString('es-PE', { hour12: false }).slice(0, 5),
      tipo_cambio: 1.00, // Soles
      tipo_operacion: '1001', // Venta interna
      tipo_afectacion_igv: '10', // Gravado
      total_gravada: subtotal,
      total_igv: igv,
      valor_total: total,
      total: total,
      anticipos: [],
      items,
      cliente: clienteData,
      guia_remision: null,
      observaciones: `Pedido #${pedido.id.slice(-8)}`,
      environment: 'produccion', // Cambiar a 'homologacion' para pruebas
      send_automatic: true
    };

    const token = process.env.NUBEFACT_API_TOKEN;
    const isMockMode = !token || token === 'xxxxx' || token === '';

    if (isMockMode) {
      // --- Modo Simulado (Fallback local) ---
      const numCorrelativo = parseInt(invoicePayload.correlativo);
      const sunatResponse = {
        sunat_description: 'OK',
        status: 'accepted',
        serie: invoicePayload.serie,
        numero: numCorrelativo,
        hash: 'MOCK_HASH_' + Math.random().toString(36).substring(7).toUpperCase(),
        links: {
          pdf: `http://localhost:4000/api/invoices/${pedido.id}/download`,
          xml: '#'
        }
      };

      // Guardar comprobante en BD
      const comprobante = await prisma.comprobante.create({
        data: {
          pedidoId: pedido.id,
          tipo: tipoComprobante.toUpperCase(),
          serie: sunatResponse.serie,
          numero: sunatResponse.numero,
          sunatHash: sunatResponse.hash,
          pdfUrl: sunatResponse.links.pdf,
          xmlUrl: sunatResponse.links.xml,
          estado: 'EMITIDO'
        }
      });

      // Generar PDF localmente
      const pdfPath = path.join(INVOICES_DIR, `${pedido.id}.pdf`);
      await generateLocalPDF(pedido, comprobante, pdfPath);

      return {
        success: true,
        comprobante,
        sunatResponse
      };
    }

    // Enviar a Nubefact
    const response = await nubefactClient.post('/documents', invoicePayload);

    if (response.data.sunat_description === 'OK' || response.data.status === 'accepted') {
      // Guardar comprobante en BD
      const comprobante = await prisma.comprobante.create({
        data: {
          pedidoId: pedido.id,
          tipo: tipoComprobante.toUpperCase(),
          serie: response.data.serie || invoicePayload.serie,
          numero: parseInt(response.data.numero || invoicePayload.correlativo),
          sunatHash: response.data.hash || '',
          pdfUrl: response.data.links?.pdf || '',
          xmlUrl: response.data.links?.xml || '',
          estado: 'EMITIDO'
        }
      });

      // Descargar PDF y guardarlo localmente (opcional)
      if (response.data.links?.pdf) {
        await downloadPDF(response.data.links.pdf, pedido.id);
      }

      return {
        success: true,
        comprobante,
        sunatResponse: response.data
      };
    } else {
      throw new Error(`Error en SUNAT: ${response.data.sunat_description}`);
    }
  } catch (error) {
    console.error('Error generando comprobante:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtener siguiente correlativo
 */
const getNextCorrelativo = async (tipo) => {
  const lastInvoice = await prisma.comprobante.findFirst({
    where: { 
      tipo: tipo.toUpperCase(),
      serie: tipo === 'factura' ? 'F001' : 'B001'
    },
    orderBy: { numero: 'desc' }
  });

  return lastInvoice ? (lastInvoice.numero + 1).toString().padStart(8, '0') : '00000001';
};

/**
 * Descargar PDF de Nubefact
 */
const downloadPDF = async (pdfUrl, pedidoId) => {
  try {
    const response = await axios.get(pdfUrl, { responseType: 'stream' });
    const filePath = path.join(INVOICES_DIR, `${pedidoId}.pdf`);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error descargando PDF:', error);
  }
};

/**
 * Consultar estado de comprobante en SUNAT
 */
export const checkInvoiceStatus = async (serie, numero) => {
  try {
    const response = await nubefactClient.get(`/documents/${serie}-${numero}/status`);
    return response.data;
  } catch (error) {
    console.error('Error consultando estado:', error);
    return null;
  }
};

/**
 * Anular comprobante (nota de crédito)
 */
export const cancelInvoice = async (pedidoId, motivo) => {
  try {
    const comprobante = await prisma.comprobante.findUnique({
      where: { pedidoId }
    });

    if (!comprobante) {
      throw new Error('Comprobante no encontrado');
    }

    const response = await nubefactClient.post('/documents/cancel', {
      tipo_doc: comprobante.tipo === 'FACTURA' ? '01' : '03',
      serie: comprobante.serie,
      numero: comprobante.numero.toString().padStart(8, '0'),
      motivo: motivo || 'Anulación por solicitud del cliente'
    });

    if (response.data.sunat_description === 'OK') {
      await prisma.comprobante.update({
        where: { pedidoId },
        data: { estado: 'ANULADO' }
      });

      return { success: true, data: response.data };
    }

    return { success: false, error: response.data.sunat_description };
  } catch (error) {
    console.error('Error anulando comprobante:', error);
    return { success: false, error: error.message };
  }
};