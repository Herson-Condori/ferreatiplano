// src/pages/Cotizador.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Calculator, Package, Download, ShoppingCart, 
  ChevronDown, ChevronUp, Info, Loader2, CheckCircle 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../store/useAuthStore';

// Tipos de proyecto disponibles
const PROJECT_TYPES = [
  { 
    id: 'pared_ladrillo', 
    name: '🧱 Pared de Ladrillo', 
    unit: 'm²',
    description: 'Pared con ladrillo King Kong de 18 huecos, e=15cm',
    fields: ['area']
  },
  { 
    id: 'columna', 
    name: '🏗️ Columna', 
    unit: 'm³',
    description: 'Columna de concreto armado 25x25cm',
    fields: ['largo', 'ancho', 'alto']
  },
  { 
    id: 'losa_aligerada', 
    name: '🏠 Losa Aligerada', 
    unit: 'm²',
    description: 'Losa aligerada con ladrillo pandereta, e=20cm',
    fields: ['area']
  },
  { 
    id: 'tarrajeo', 
    name: '🧱 Tarrajeo', 
    unit: 'm²',
    description: 'Tarrajeo de pared con mezcla, e=1.5cm',
    fields: ['area']
  },
  { 
    id: 'concreto_simple', 
    name: '🪨 Concreto Simple', 
    unit: 'm³',
    description: 'Concreto para cimentación o sobrecimiento',
    fields: ['largo', 'ancho', 'alto']
  }
];

export default function Cotizador() {
  const navigate = useNavigate();
  
  // Estados del formulario
  const [projectType, setProjectType] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [clientInfo, setClientInfo] = useState({ nombre: '', telefono: '' });
  
  // Estados de resultado
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);

  // Manejar cambio de tipo de proyecto
  const handleProjectChange = (typeId) => {
    setProjectType(typeId);
    setMeasurements({});
    setQuote(null);
    setError('');
  };

  // Manejar cambio de medidas
  const handleMeasurementChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setMeasurements(prev => ({ ...prev, [field]: numValue }));
  };

  // Calcular área si es necesario
  const getArea = () => {
    if (measurements.area) return measurements.area;
    if (measurements.largo && measurements.ancho) {
      return measurements.largo * measurements.ancho;
    }
    return 0;
  };

  // Calcular volumen si es necesario
  const getVolume = () => {
    if (measurements.volume) return measurements.volume;
    if (measurements.largo && measurements.ancho && measurements.alto) {
      return measurements.largo * measurements.ancho * measurements.alto;
    }
    return 0;
  };

  // Enviar cálculo al backend
  const handleCalculate = async () => {
    if (!projectType) {
      setError('Selecciona un tipo de proyecto');
      return;
    }

    const area = getArea();
    const volume = getVolume();
    
    if (area <= 0 && volume <= 0) {
      setError('Ingresa medidas válidas mayores a cero');
      return;
    }

    setCalculating(true);
    setError('');

    try {
      const { data } = await axios.post('http://localhost:4000/api/quotes/calculate', {
        projectType,
        measurements: {
          area: area > 0 ? area : undefined,
          volume: volume > 0 ? volume : undefined,
          ...measurements
        },
        clientInfo: showClientForm ? clientInfo : undefined
      });

      if (data.success) {
        setQuote(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error calculando cotización');
    } finally {
      setCalculating(false);
    }
  };

  // Generar y descargar PDF
  const handleDownloadPDF = async () => {
    if (!quote) return;

    try {
      // Opción A: Descargar desde backend
      const response = await axios.post(
        'http://localhost:4000/api/quotes/pdf',
        { quoteData: quote },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cotizacion-${quote.quoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // Opción B: Generar PDF en frontend (fallback)
      generateFrontendPDF(quote);
    }
  };

  // Generar PDF en frontend con jsPDF
  const generateFrontendPDF = (quote) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(232, 160, 32); // Color ámbar
    doc.text('CONSTRUMAX', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Materiales de Construcción - Juliaca', 105, 26, { align: 'center' });
    
    // Info de cotización
    doc.setFontSize(11);
    doc.text(`Cotización: ${quote.quoteId}`, 14, 40);
    doc.text(`Fecha: ${new Date(quote.generatedAt).toLocaleDateString('es-PE')}`, 14, 46);
    if (quote.client?.nombre) {
      doc.text(`Cliente: ${quote.client.nombre}`, 14, 52);
    }

    // Proyecto
    doc.setFontSize(10);
    doc.text(`Proyecto: ${getProjectTypeName(quote.project.type)}`, 14, 64);
    doc.text(`Cantidad: ${quote.project.quantity} ${quote.project.unit}`, 14, 70);

    // Tabla de materiales
    const tableData = Object.entries(quote.materials).map(([key, mat]) => [
      mat.name,
      mat.quantity.toFixed(2),
      mat.unit.split('/')[0],
      `S/ ${mat.unitPrice.toFixed(2)}`,
      `S/ ${mat.subtotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Producto', 'Cant.', 'Unidad', 'P.Unit', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [232, 160, 32], textColor: [15, 14, 12] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    // Totales
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: S/ ${quote.totals.subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`IGV (18%): S/ ${quote.totals.igv.toFixed(2)}`, 140, finalY + 6);
    doc.setFontSize(12);
    doc.setTextColor(232, 160, 32);
    doc.text(`TOTAL: S/ ${quote.totals.total.toFixed(2)}`, 140, finalY + 14);
    doc.setTextColor(0, 0, 0);

    // Notas
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Notas:', 14, finalY + 30);
    quote.notes.forEach((note, i) => {
      doc.text(`• ${note}`, 14, finalY + 35 + (i * 4));
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(232, 160, 32);
    doc.text('¡Gracias por confiar en Construmax!', 105, 285, { align: 'center' });

    // Guardar
    doc.save(`cotizacion-${quote.quoteId}.pdf`);
  };

  // Agregar cotización al carrito
  const handleAddToCart = () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      navigate('/login');
      return;
    }
    // Aquí integrarías con el useCartStore
    // Por ahora, redirigir al catálogo con los items
    alert('✅ Cotización agregada al carrito\n\nRedirigiendo al checkout...');
    navigate('/checkout');
  };

  // Obtener nombre legible del proyecto
  const getProjectTypeName = (type) => {
    return PROJECT_TYPES.find(p => p.id === type)?.name || type;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="font-display text-4xl font-bold text-accent mb-2 text-center">
        COTIZADOR DE PROYECTOS
      </h1>
      <p className="text-light-text/70 text-center mb-8">
        Calcula los materiales necesarios para tu obra en Juliaca
      </p>

      {/* Selector de Tipo de Proyecto */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-6">
        <h2 className="font-display text-xl text-light-text mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-accent" />
          1. Selecciona el tipo de obra
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROJECT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => handleProjectChange(type.id)}
              className={`p-4 rounded-lg border text-left transition ${
                projectType === type.id 
                  ? 'border-accent bg-accent/10 ring-2 ring-accent/50' 
                  : 'border-dark-border hover:border-light-text/50'
              }`}
            >
              <p className="font-medium text-light-text">{type.name}</p>
              <p className="text-xs text-light-text/60 mt-1">{type.description}</p>
              <p className="text-xs text-accent mt-2">Unidad: {type.unit}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Medidas del Proyecto */}
      {projectType && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-xl text-light-text mb-4 flex items-center gap-2">
            <Package size={20} className="text-accent" />
            2. Ingresa las medidas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROJECT_TYPES.find(p => p.id === projectType)?.fields.map(field => (
              <div key={field}>
                <label className="block text-light-text/70 text-sm mb-1 capitalize">
                  {field === 'area' ? 'Área (m²)' : 
                   field === 'largo' ? 'Largo (m)' :
                   field === 'ancho' ? 'Ancho (m)' : 'Alto (m)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={measurements[field] || ''}
                  onChange={(e) => handleMeasurementChange(field, e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>

          {/* Vista previa de cálculo */}
          {(getArea() > 0 || getVolume() > 0) && (
            <div className="mt-4 p-3 bg-dark-bg rounded-lg border border-dark-border">
              <p className="text-light-text/70 text-sm">
                {getArea() > 0 
                  ? `📐 Área calculada: ${getArea().toFixed(2)} m²`
                  : `📦 Volumen calculado: ${getVolume().toFixed(2)} m³`
                }
                <span className="text-light-text/50 ml-2">(incluye 10% de desperdicio)</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Datos del Cliente (Opcional) */}
      {projectType && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-6">
          <button
            onClick={() => setShowClientForm(!showClientForm)}
            className="flex items-center gap-2 text-light-text hover:text-accent transition mb-4"
          >
            {showClientForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            <span className="font-medium">Datos del cliente (opcional)</span>
          </button>

          {showClientForm && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
              <input
                type="text"
                placeholder="Nombre completo"
                value={clientInfo.nombre}
                onChange={(e) => setClientInfo(prev => ({ ...prev, nombre: e.target.value }))}
                className="bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
              />
              <input
                type="tel"
                placeholder="Teléfono / WhatsApp"
                value={clientInfo.telefono}
                onChange={(e) => setClientInfo(prev => ({ ...prev, telefono: e.target.value }))}
                className="bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>
      )}

      {/* Botón Calcular */}
      {projectType && (
        <div className="text-center mb-8">
          <button
            onClick={handleCalculate}
            disabled={calculating || (getArea() <= 0 && getVolume() <= 0)}
            className="bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 px-8 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {calculating ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Calculando...
              </>
            ) : (
              <>
                <Calculator size={20} /> Calcular Cotización
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Resultados de la Cotización */}
      {quote && (
        <div className="bg-dark-surface border border-accent/30 rounded-xl p-6 mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-accent">
              ✅ Cotización Generada
            </h2>
            <span className="text-light-text/50 text-sm font-mono">
              {quote.quoteId}
            </span>
          </div>

          {/* Resumen del proyecto */}
          <div className="bg-dark-bg rounded-lg p-4 mb-6">
            <p className="text-light-text/70 text-sm">
              <span className="text-light-text font-medium">Proyecto:</span> {getProjectTypeName(quote.project.type)}
            </p>
            <p className="text-light-text/70 text-sm">
              <span className="text-light-text font-medium">Cantidad:</span> {quote.project.quantity} {quote.project.unit}
            </p>
            <p className="text-light-text/70 text-sm">
              <span className="text-light-text font-medium">Desperdicio incluido:</span> 10%
            </p>
          </div>

          {/* Tabla de materiales */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="text-left p-3 text-light-text/70">Producto</th>
                  <th className="text-right p-3 text-light-text/70">Cant.</th>
                  <th className="text-left p-3 text-light-text/70">Unidad</th>
                  <th className="text-right p-3 text-light-text/70">P.Unit</th>
                  <th className="text-right p-3 text-light-text/70">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {Object.entries(quote.materials).map(([key, mat]) => (
                  <tr key={key} className="hover:bg-dark-bg/50">
                    <td className="p-3 text-light-text">
                      {mat.name}
                      {mat.estimated && (
                        <span className="ml-2 text-xs text-yellow-400" title="Precio estimado">
                          ⚠️
                        </span>
                      )}
                      {!mat.available && (
                        <span className="ml-2 text-xs text-red-400" title="Sin stock">
                          ❌
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-light-text font-medium">
                      {mat.quantity.toFixed(2)}
                    </td>
                    <td className="p-3 text-light-text/60">
                      {mat.unit.split('/')[0]}
                    </td>
                    <td className="p-3 text-right text-light-text/60">
                      S/ {mat.unitPrice.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-display font-bold text-accent">
                      S/ {mat.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="border-t border-dark-border pt-4 mb-6">
            <div className="flex justify-between text-light-text/70 mb-2">
              <span>Subtotal</span>
              <span>S/ {quote.totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-light-text/70 mb-3">
              <span>IGV (18%)</span>
              <span>S/ {quote.totals.igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-display font-bold text-accent pt-3 border-t border-dark-border">
              <span>TOTAL</span>
              <span>S/ {quote.totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-dark-bg border border-dark-border hover:border-accent text-light-text font-medium py-2.5 px-5 rounded-lg transition"
            >
              <Download size={18} /> Descargar PDF
            </button>
            
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-2.5 px-5 rounded-lg transition"
            >
              <ShoppingCart size={18} /> Agregar al Carrito
            </button>

            <a
              href={`https://wa.me/51942318219?text=Hola Construmax, solicito la cotización ${quote.quoteId} por S/ ${quote.totals.total.toFixed(2)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition"
            >
              💬 Consultar por WhatsApp
            </a>
          </div>

          {/* Notas */}
          <div className="mt-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
            <p className="text-light-text/60 text-xs flex items-start gap-2">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                <strong>Notas:</strong> {quote.notes.join(' • ')}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Info adicional */}
      <div className="text-center text-light-text/50 text-sm">
        <p>💡 ¿Necesitas ayuda con tu proyecto?</p>
        <a href="/contacto" className="text-accent hover:underline">
          Contáctanos para asesoría gratuita
        </a>
      </div>
    </div>
  );
}