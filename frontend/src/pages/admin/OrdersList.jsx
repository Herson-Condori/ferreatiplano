// src/pages/admin/OrdersList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, RefreshCw, Filter, Calendar, Search, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ estado: '', busqueda: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cargar pedidos
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.busqueda) params.append('busqueda', filters.busqueda);
      
      const { data } = await axios.get(`http://localhost:4000/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(data.data);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  // Actualizar estado del pedido
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4000/api/orders/${orderId}/status`, { estado: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders(); // Recargar lista
      if (selectedOrder?.id === orderId) {
        fetchOrderDetail(orderId); // Actualizar detalle si está abierto
      }
    } catch (err) {
      alert('Error actualizando estado');
    }
  };

  // Ver detalle de pedido
  const fetchOrderDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:4000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(data.data);
    } catch (err) {
      alert('Error cargando detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  // Helpers para UI
  const getStatusColor = (status) => {
    switch (status) {
      case 'NUEVO': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'EN_PREPARACION': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'EN_CAMINO': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ENTREGADO': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'CANCELADO': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'NUEVO': return <AlertTriangle size={14} />;
      case 'ENTREGADO': return <CheckCircle size={14} />;
      case 'EN_CAMINO': return <Truck size={14} />;
      default: return <RefreshCw size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header de la página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl text-light-text">Gestión de Pedidos</h1>
          <p className="text-light-text/60 text-sm">Administra y actualiza el estado de los pedidos</p>
        </div>
        <button 
          onClick={fetchOrders} 
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition"
        >
          <RefreshCw size={18} /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, dirección o ID..." 
            value={filters.busqueda}
            onChange={(e) => setFilters({...filters, busqueda: e.target.value})}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-light-text/50" />
          <select 
            value={filters.estado}
            onChange={(e) => setFilters({...filters, estado: e.target.value})}
            className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
          >
            <option value="">Todos los estados</option>
            <option value="NUEVO">Nuevo</option>
            <option value="EN_PREPARACION">En Preparación</option>
            <option value="EN_CAMINO">En Camino</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="text-center py-20 text-accent">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <p className="text-light-text/60">No se encontraron pedidos con los filtros actuales.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">ID / Fecha</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Cliente</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Total</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Método</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Estado</th>
                  <th className="text-right p-4 text-light-text/70 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-dark-bg/50 transition">
                    <td className="p-4">
                      <p className="font-mono text-light-text text-sm">#{order.id.slice(-8)}</p>
                      <p className="text-light-text/50 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('es-PE')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-light-text text-sm">{order.cliente?.nombre || 'N/A'}</p>
                      <p className="text-light-text/50 text-xs truncate max-w-[200px]">{order.direccionEntrega}</p>
                    </td>
                    <td className="p-4 font-display font-bold text-accent">
                      S/ {Number(order.total).toFixed(2)}
                    </td>
                    <td className="p-4 text-light-text/70 text-sm">
                      {order.metodoPago}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.estado)}`}>
                        {getStatusIcon(order.estado)}
                        {order.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => fetchOrderDetail(order.id)}
                        className="p-2 text-light-text/70 hover:text-accent transition"
                        title="Ver Detalle"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="p-6 border-b border-dark-border flex justify-between items-center sticky top-0 bg-dark-surface z-10">
              <div>
                <h2 className="font-display text-xl text-light-text">Pedido #{selectedOrder.id.slice(-8)}</h2>
                <p className="text-light-text/50 text-sm">
                  {new Date(selectedOrder.createdAt).toLocaleString('es-PE')}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-light-text/50 hover:text-light-text">
                ✕
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 space-y-6">
              
              {/* Info del Cliente y Envío */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                  <h3 className="text-light-text font-medium mb-3 flex items-center gap-2">
                    👤 Cliente
                  </h3>
                  <p className="text-light-text text-sm">{selectedOrder.cliente?.nombre}</p>
                  <p className="text-light-text/50 text-xs">{selectedOrder.cliente?.email}</p>
                  <p className="text-light-text/50 text-xs">{selectedOrder.cliente?.telefono}</p>
                </div>
                <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                  <h3 className="text-light-text font-medium mb-3 flex items-center gap-2">
                     Dirección de Entrega
                  </h3>
                  <p className="text-light-text text-sm">{selectedOrder.direccionEntrega}</p>
                  <p className="text-light-text/50 text-xs">Delivery: S/ {Number(selectedOrder.costoDelivery || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Items del Pedido */}
              <div>
                <h3 className="text-light-text font-medium mb-3">Productos</h3>
                <div className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b border-dark-border last:border-0">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.producto.imagenes[0] || 'https://via.placeholder.com/40'} 
                          alt={item.producto.nombre}
                          className="w-10 h-10 object-cover rounded bg-dark-surface"
                        />
                        <div>
                          <p className="text-light-text text-sm">{item.producto.nombre}</p>
                          <p className="text-light-text/50 text-xs">{item.cantidad} x S/ {Number(item.precioUnitario || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <span className="font-display font-bold text-accent text-sm">
                        S/ {(item.precioUnitario * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-right">
                  <p className="text-light-text/70 text-sm">Subtotal: S/ {(Number(selectedOrder.total || 0) - Number(selectedOrder.costoDelivery || 0)).toFixed(2)}</p>
                  <p className="text-light-text/70 text-sm">Delivery: S/ {Number(selectedOrder.costoDelivery || 0).toFixed(2)}</p>
                  <p className="text-light-text font-bold text-xl border-t border-dark-border pt-2">
                    Total: S/ {Number(selectedOrder.total || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Acciones: Cambiar Estado */}
              <div className="pt-4 border-t border-dark-border">
                <h3 className="text-light-text font-medium mb-3">Cambiar Estado</h3>
                <div className="flex flex-wrap gap-2">
                  {['NUEVO', 'EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.estado === status}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        selectedOrder.estado === status 
                          ? 'bg-accent text-dark-bg border-accent' 
                          : 'bg-dark-bg text-light-text/70 border-dark-border hover:border-accent hover:text-accent'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}