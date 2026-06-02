import nubefactClient from '../config/nubefact.js';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear carpeta para comprobantes si no existe
const INVOICES_DIR = path.join(__dirname, '../../invoices');
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

/**
 * Generar comprobante electrónico (Boleta o Factura)
 */
export const generateInvoice = async (pedido) => {
  try {
    // Determinar tipo de comprobante
    const esFactura = pedido.cliente?.ruc && pedido.cliente.ruc.length === 11;
    const tipoComprobante = esFactura ? 'factura' : 'boleta';

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
      // Opcional: enviar automáticamente a SUNAT
      send_automatic: true
    };

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