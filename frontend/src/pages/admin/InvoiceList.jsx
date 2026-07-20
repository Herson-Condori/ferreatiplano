import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { 
  Download, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  FileSpreadsheet, 
  AlertCircle, 
  TrendingUp, 
  Printer, 
  User, 
  Coins 
} from 'lucide-react';

export default function InvoiceList() {
  const [activeTab, setActiveTab] = useState('emitidos');
  const [invoices, setInvoices] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [issuedRes, pendingRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/invoices/pending')
      ]);
      setInvoices(issuedRes.data.data || []);
      setPendingOrders(pendingRes.data.data || []);
    } catch (err) {
      console.error('Error cargando datos de facturación:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (pedidoId, serie, numero) => {
    try {
      const response = await api.get(`/invoices/${pedidoId}/download`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${serie}-${numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando comprobante:', error);
      alert('Error al descargar el PDF. Posiblemente no esté disponible aún.');
    }
  };

  const handleGenerateInvoice = async (pedidoId, tipo, clienteName, hasRuc) => {
    if (tipo === 'FACTURA' && !hasRuc) {
      alert(`No se puede emitir una FACTURA para ${clienteName} porque no tiene un RUC de 11 dígitos registrado.`);
      return;
    }

    const docName = tipo === 'FACTURA' ? 'FACTURA' : 'BOLETA';
    if (!confirm(`¿Confirmas la emisión electrónica de una ${docName} para el pedido de ${clienteName}?`)) {
      return;
    }

    setActionLoading(pedidoId);
    try {
      await api.post(
        `/invoices/${pedidoId}/generate`,
        { tipo }
      );
      alert(`Comprobante (${tipo}) emitido exitosamente.`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Error generando comprobante: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const cancelInvoice = async (pedidoId) => {
    if (!confirm('¿Estás seguro de anular este comprobante electrónico? Esta acción enviará una comunicación de baja a la SUNAT.')) {
      return;
    }

    const motivo = prompt('Especifica el motivo de la anulación (mínimo 10 caracteres):');
    if (!motivo) return;
    if (motivo.length < 10) {
      alert('El motivo debe ser más descriptivo (mínimo 10 caracteres).');
      return;
    }

    setActionLoading(pedidoId);
    try {
      await api.post(
        `/invoices/${pedidoId}/cancel`,
        { motivo }
      );
      alert('Comprobante anulado y dado de baja correctamente.');
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Error anulando comprobante: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // --- CÁLCULO DE ESTADÍSTICAS ---
  const activeInvoices = invoices.filter(i => i.comprobante?.estado === 'EMITIDO');
  const totalFacturado = activeInvoices.reduce((sum, i) => sum + Number(i.total), 0);
  const boletasCount = activeInvoices.filter(i => i.comprobante?.tipo === 'BOLETA').length;
  const facturasCount = activeInvoices.filter(i => i.comprobante?.tipo === 'FACTURA').length;
  const pendingCount = pendingOrders.length;

  // --- FILTROS DE COMPROBANTES EMITIDOS ---
  const filteredInvoices = invoices.filter(pedido => {
    if (!pedido.comprobante) return false;
    
    const docNum = `${pedido.comprobante.serie}-${pedido.comprobante.numero.toString().padStart(8, '0')}`;
    const nameMatch = pedido.cliente?.nombre?.toLowerCase().includes(searchQuery.toLowerCase());
    const docMatch = docNum.toLowerCase().includes(searchQuery.toLowerCase());
    const searchMatch = searchQuery === '' || nameMatch || docMatch;

    const typeMatch = typeFilter === '' || pedido.comprobante.tipo === typeFilter;
    return searchMatch && typeMatch;
  });

  // --- FILTROS DE PEDIDOS PENDIENTES ---
  const filteredPending = pendingOrders.filter(pedido => {
    const idMatch = pedido.id.slice(-8).toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = pedido.cliente?.nombre?.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery === '' || idMatch || nameMatch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl text-light-text">Facturación Electrónica (SUNAT)</h1>
          <p className="text-light-text/60 text-sm">Emite, descarga y gestiona boletas de venta y facturas electrónicas.</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Tarjetas Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Facturado */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-light-text/50 text-xs font-medium uppercase tracking-wider">Total Facturado</p>
            <p className="font-display text-2xl font-bold text-light-text">S/ {totalFacturado.toFixed(2)}</p>
          </div>
        </div>

        {/* Boletas */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-light-text/50 text-xs font-medium uppercase tracking-wider">Boletas Emitidas</p>
            <p className="font-display text-2xl font-bold text-light-text">{boletasCount}</p>
          </div>
        </div>

        {/* Facturas */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-light-text/50 text-xs font-medium uppercase tracking-wider">Facturas Emitidas</p>
            <p className="font-display text-2xl font-bold text-light-text">{facturasCount}</p>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-light-text/50 text-xs font-medium uppercase tracking-wider">Pedidos por Facturar</p>
            <p className="font-display text-2xl font-bold text-light-text">{pendingCount}</p>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        <button
          onClick={() => { setActiveTab('emitidos'); setSearchQuery(''); }}
          className={`px-6 py-3 font-display text-lg font-bold border-b-2 transition ${
            activeTab === 'emitidos' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-light-text/60 hover:text-light-text'
          }`}
        >
          Comprobantes Emitidos ({invoices.length})
        </button>
        <button
          onClick={() => { setActiveTab('pendientes'); setSearchQuery(''); }}
          className={`px-6 py-3 font-display text-lg font-bold border-b-2 transition ${
            activeTab === 'pendientes' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-light-text/60 hover:text-light-text'
          }`}
        >
          Pendientes de Facturación ({pendingOrders.length})
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
          <input 
            type="text" 
            placeholder={
              activeTab === 'emitidos' 
                ? "Buscar por cliente, serie o número..." 
                : "Buscar por cliente o ID de pedido..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
          />
        </div>
        {activeTab === 'emitidos' && (
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-light-text/50" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
            >
              <option value="">Todos los tipos</option>
              <option value="BOLETA">Boletas</option>
              <option value="FACTURA">Facturas</option>
            </select>
          </div>
        )}
      </div>

      {/* Vista Principal */}
      {loading ? (
        <div className="text-center py-20 text-accent">Cargando datos de facturación...</div>
      ) : activeTab === 'emitidos' ? (
        
        // --- TABLA DE COMPROBANTES EMITIDOS ---
        filteredInvoices.length === 0 ? (
          <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
            <FileSpreadsheet className="mx-auto text-light-text/30 mb-4" size={48} />
            <p className="text-light-text/60">No se encontraron comprobantes emitidos.</p>
          </div>
        ) : (
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Comprobante</th>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Cliente</th>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Fecha Emisión</th>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Importe Total</th>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Estado</th>
                    <th className="text-right p-4 text-light-text/70 font-medium text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredInvoices.map(pedido => (
                    <tr key={pedido.id} className="hover:bg-dark-bg/50 transition">
                      
                      {/* Documento */}
                      <td className="p-4">
                        <p className="font-mono text-light-text text-sm font-semibold">
                          {pedido.comprobante.serie}-{pedido.comprobante.numero.toString().padStart(8, '0')}
                        </p>
                        <span className={`inline-flex px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold border ${
                          pedido.comprobante.tipo === 'FACTURA'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {pedido.comprobante.tipo}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="p-4">
                        <p className="text-light-text text-sm font-medium">{pedido.cliente?.nombre || 'Cliente General'}</p>
                        {pedido.cliente?.ruc && (
                          <p className="text-light-text/50 text-xs mt-0.5">RUC: {pedido.cliente.ruc}</p>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="p-4 text-light-text/70 text-sm">
                        {new Date(pedido.comprobante.createdAt).toLocaleDateString('es-PE')}
                        <p className="text-light-text/40 text-xs mt-0.5">
                          {new Date(pedido.comprobante.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="p-4 font-display font-bold text-accent text-base">
                        S/ {Number(pedido.total).toFixed(2)}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          pedido.comprobante.estado === 'EMITIDO'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            pedido.comprobante.estado === 'EMITIDO' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          {pedido.comprobante.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => downloadPDF(pedido.id, pedido.comprobante.serie, pedido.comprobante.numero)}
                            disabled={actionLoading === pedido.id}
                            className="p-2 text-light-text/70 hover:text-accent border border-dark-border hover:border-accent/40 rounded-lg transition disabled:opacity-50"
                            title="Descargar PDF"
                          >
                            <Download size={16} />
                          </button>
                          {pedido.comprobante.estado === 'EMITIDO' && (
                            <button
                              onClick={() => cancelInvoice(pedido.id)}
                              disabled={actionLoading === pedido.id}
                              className="p-2 text-red-400 hover:text-red-300 border border-dark-border hover:border-red-500/30 rounded-lg transition disabled:opacity-50"
                              title="Anular Comprobante"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      ) : (
        
        // --- TABLA DE PEDIDOS PENDIENTES ---
        filteredPending.length === 0 ? (
          <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
            <CheckCircle className="mx-auto text-green-400/30 mb-4" size={48} />
            <p className="text-light-text/60 font-semibold">¡Todo al día!</p>
            <p className="text-light-text/40 text-sm mt-1">No hay pedidos pendientes de facturación en este momento.</p>
          </div>
        ) : (
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Pedido ID</th>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Cliente</th>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Importe</th>
                    <th className="text-left p-4 text-light-text/70 font-medium text-sm">Pago / Estado</th>
                    <th className="text-right p-4 text-light-text/70 font-medium text-sm">Acciones de Emisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredPending.map(pedido => {
                    const hasRuc = pedido.cliente?.ruc && pedido.cliente.ruc.length === 11;
                    const isProcessing = actionLoading === pedido.id;
                    
                    return (
                      <tr key={pedido.id} className="hover:bg-dark-bg/50 transition">
                        
                        {/* ID Pedido */}
                        <td className="p-4">
                          <p className="font-mono text-light-text text-sm">#{pedido.id.slice(-8).toUpperCase()}</p>
                          <p className="text-light-text/50 text-xs mt-0.5">
                            {new Date(pedido.createdAt).toLocaleDateString('es-PE')}
                          </p>
                        </td>

                        {/* Cliente */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <User size={14} className="text-light-text/40" />
                            <p className="text-light-text text-sm font-medium">{pedido.cliente?.nombre || 'Cliente General'}</p>
                          </div>
                          {hasRuc ? (
                            <span className="inline-flex px-2 py-0.5 mt-1 rounded bg-green-500/10 text-green-400 border border-green-500/25 text-[10px] font-bold">
                              RUC: {pedido.cliente.ruc}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 mt-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 text-[10px] font-bold">
                              Sólo Boleta (Sin RUC)
                            </span>
                          )}
                        </td>

                        {/* Total */}
                        <td className="p-4">
                          <p className="font-display font-bold text-accent text-base">S/ {Number(pedido.total).toFixed(2)}</p>
                          <p className="text-light-text/40 text-xs mt-0.5">Delivery: S/ {Number(pedido.costoDelivery || 0).toFixed(2)}</p>
                        </td>

                        {/* Estado Pago */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                            pedido.pago?.estado === 'PAGADO'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            <Coins size={12} />
                            {pedido.pago?.estado || 'PENDIENTE'}
                          </span>
                          <p className="text-light-text/50 text-xs mt-1">Método: {pedido.metodoPago}</p>
                        </td>

                        {/* Acciones */}
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            
                            {/* Emitir Boleta */}
                            <button
                              onClick={() => handleGenerateInvoice(pedido.id, 'BOLETA', pedido.cliente?.nombre, hasRuc)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 shadow-md"
                            >
                              Emitir Boleta
                            </button>

                            {/* Emitir Factura */}
                            <button
                              onClick={() => handleGenerateInvoice(pedido.id, 'FACTURA', pedido.cliente?.nombre, hasRuc)}
                              disabled={isProcessing || !hasRuc}
                              className={`px-3 py-1.5 font-bold text-xs rounded-lg transition shadow-md ${
                                hasRuc 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                                  : 'bg-dark-bg text-light-text/30 border border-dark-border cursor-not-allowed'
                              }`}
                              title={hasRuc ? 'Emitir Factura Electrónica' : 'RUC requerido para Factura'}
                            >
                              Emitir Factura
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

    </div>
  );
}