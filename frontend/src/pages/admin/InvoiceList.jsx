import { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Eye, XCircle } from 'lucide-react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      // Obtener todos los pedidos con comprobantes
      const { data } = await axios.get('http://localhost:4000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filtrar solo los que tienen comprobante
      const withInvoices = data.data.filter(p => p.comprobante);
      setInvoices(withInvoices);
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (pedidoId, serie, numero) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/invoices/${pedidoId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${serie}-${numero}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error descargando:', error);
    }
  };

  const cancelInvoice = async (pedidoId) => {
    if (!confirm('¿Estás seguro de anular este comprobante? Esta acción no se puede deshacer.')) {
      return;
    }

    const motivo = prompt('Motivo de anulación:');
    if (!motivo) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:4000/api/invoices/${pedidoId}/cancel`,
        { motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Comprobante anulado correctamente');
      fetchInvoices();
    } catch (err) {
      alert('Error anulando comprobante: ' + err.response?.data?.error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="font-display text-3xl text-accent mb-6">Comprobantes Emitidos</h1>

      {loading ? (
        <div className="text-center py-10 text-accent">Cargando...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-10 text-light-text/60">
          No hay comprobantes emitidos aún
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-bg border-b border-dark-border">
              <tr>
                <th className="text-left p-4 text-light-text/70">Comprobante</th>
                <th className="text-left p-4 text-light-text/70">Cliente</th>
                <th className="text-left p-4 text-light-text/70">Fecha</th>
                <th className="text-left p-4 text-light-text/70">Total</th>
                <th className="text-left p-4 text-light-text/70">Estado</th>
                <th className="text-right p-4 text-light-text/70">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {invoices.map(pedido => (
                <tr key={pedido.id} className="hover:bg-dark-bg/50">
                  <td className="p-4">
                    <p className="font-mono text-light-text">
                      {pedido.comprobante.serie}-{pedido.comprobante.numero.toString().padStart(8, '0')}
                    </p>
                    <p className="text-xs text-light-text/50">{pedido.comprobante.tipo}</p>
                  </td>
                  <td className="p-4 text-light-text">{pedido.cliente?.nombre || 'N/A'}</td>
                  <td className="p-4 text-light-text/60">
                    {new Date(pedido.createdAt).toLocaleDateString('es-PE')}
                  </td>
                  <td className="p-4 font-display font-bold text-accent">
                    S/ {Number(pedido.total).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      pedido.comprobante.estado === 'EMITIDO' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pedido.comprobante.estado}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => downloadPDF(pedido.id, pedido.comprobante.serie, pedido.comprobante.numero)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Descargar PDF"
                    >
                      <Download size={18} />
                    </button>
                    {pedido.comprobante.estado === 'EMITIDO' && (
                      <button
                        onClick={() => cancelInvoice(pedido.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Anular"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}