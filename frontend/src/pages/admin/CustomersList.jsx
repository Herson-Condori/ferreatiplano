// src/pages/admin/CustomersList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Mail, Phone, MapPin, FileText, Calendar, 
  Search, Filter, Eye, Edit, ToggleLeft, ToggleRight,
  Download, RefreshCw, X
} from 'lucide-react';

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    busqueda: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Cargar clientes
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.busqueda) params.append('busqueda', filters.busqueda);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
      
      const { data } = await axios.get(`http://localhost:4000/api/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  // Ver detalle de cliente
  const fetchCustomerDetail = async (id) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:4000/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCustomer(data.data);
    } catch (err) {
      alert('Error cargando detalle del cliente');
    } finally {
      setDetailLoading(false);
    }
  };

  // Abrir modal de edición
  const openEditModal = (customer) => {
    setEditForm({
      nombre: customer.nombre,
      email: customer.email,
      telefono: customer.telefono || '',
      direccion: customer.direccion || '',
      ruc: customer.ruc || '',
      activo: customer.activo
    });
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  // Guardar cambios del cliente
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:4000/api/customers/${selectedCustomer.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      fetchCustomers();
      if (selectedCustomer.id === selectedCustomer?.id) {
        fetchCustomerDetail(selectedCustomer.id);
      }
    } catch (err) {
      alert('Error actualizando: ' + (err.response?.data?.error || err.message));
    }
  };

  // Activar/Desactivar cuenta
  const handleToggleStatus = async (customerId, currentStatus) => {
    if (!confirm(`¿${currentStatus ? 'Desactivar' : 'Activar'} esta cuenta?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4000/api/customers/${customerId}/status`, 
        { activo: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCustomers();
    } catch (err) {
      alert('Error actualizando estado');
    }
  };

  // Exportar a CSV
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/customers/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clientes-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error exportando datos');
    }
  };

  // Helpers UI
  const formatDate = (date) => new Date(date).toLocaleDateString('es-PE');
  const formatCurrency = (amount) => `S/ ${Number(amount).toFixed(2)}`;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl text-light-text">Gestión de Clientes</h1>
          <p className="text-light-text/60 text-sm">Administra cuentas y revisa historial de compras</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border text-light-text rounded-lg hover:border-accent transition"
          >
            <Download size={18} /> Exportar CSV
          </button>
          <button 
            onClick={fetchCustomers} 
            className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition"
          >
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o teléfono..." 
            value={filters.busqueda}
            onChange={(e) => setFilters({...filters, busqueda: e.target.value})}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
          />
        </div>
        <select 
          value={filters.estado}
          onChange={(e) => setFilters({...filters, estado: e.target.value})}
          className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-light-text/50" />
          <input 
            type="date"
            value={filters.fechaDesde}
            onChange={(e) => setFilters({...filters, fechaDesde: e.target.value})}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-light-text text-sm focus:outline-none focus:border-accent"
          />
          <span className="text-light-text/50">-</span>
          <input 
            type="date"
            value={filters.fechaHasta}
            onChange={(e) => setFilters({...filters, fechaHasta: e.target.value})}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-light-text text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      {loading ? (
        <div className="text-center py-20 text-accent">Cargando clientes...</div>
      ) : customers.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <Users className="mx-auto text-light-text/30 mb-4" size={48} />
          <p className="text-light-text/60">No se encontraron clientes con los filtros actuales.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Cliente</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Contacto</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Pedidos</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Registro</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Estado</th>
                  <th className="text-right p-4 text-light-text/70 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-dark-bg/50 transition">
                    <td className="p-4">
                      <p className="text-light-text font-medium text-sm">{customer.nombre}</p>
                      {customer.ruc && (
                        <p className="text-light-text/50 text-xs">RUC: {customer.ruc}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <p className="text-light-text/70 flex items-center gap-1">
                          <Mail size={12} /> {customer.email}
                        </p>
                        {customer.telefono && (
                          <p className="text-light-text/50 flex items-center gap-1">
                            <Phone size={12} /> {customer.telefono}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-light-text font-medium">{customer._count?.pedidos || 0}</span>
                      <p className="text-light-text/50 text-xs">pedidos</p>
                    </td>
                    <td className="p-4 text-light-text/70 text-sm">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.activo 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {customer.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => fetchCustomerDetail(customer.id)}
                          className="p-2 text-light-text/70 hover:text-accent transition"
                          title="Ver Detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => openEditModal(customer)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(customer.id, customer.activo)}
                          className={`p-2 transition ${
                            customer.activo ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                          }`}
                          title={customer.activo ? 'Desactivar' : 'Activar'}
                        >
                          {customer.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-dark-border">
              <p className="text-light-text/60 text-sm">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} clientes)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({...filters, page: pagination.page - 1})}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1.5 rounded-lg border border-dark-border text-light-text hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFilters({...filters, page: pagination.page + 1})}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1.5 rounded-lg border border-dark-border text-light-text hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Detalle de Cliente */}
      {selectedCustomer && !showEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="p-6 border-b border-dark-border flex justify-between items-center sticky top-0 bg-dark-surface z-10">
              <div>
                <h2 className="font-display text-xl text-light-text">{selectedCustomer.nombre}</h2>
                <p className="text-light-text/50 text-sm">Cliente desde {formatDate(selectedCustomer.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-light-text/50 hover:text-light-text">
                <X size={24} />
              </button>
            </div>

            {/* Contenido Modal */}
            {detailLoading ? (
              <div className="p-12 text-center text-accent">Cargando...</div>
            ) : (
              <div className="p-6 space-y-6">
                
                {/* Info Personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <h3 className="text-light-text font-medium mb-3 flex items-center gap-2">
                      <Users size={18} className="text-accent" /> Información Personal
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-light-text/50">Email:</span> <span className="text-light-text">{selectedCustomer.email}</span></p>
                      <p><span className="text-light-text/50">Teléfono:</span> <span className="text-light-text">{selectedCustomer.telefono || 'No registrado'}</span></p>
                      <p><span className="text-light-text/50">Dirección:</span> <span className="text-light-text">{selectedCustomer.direccion || 'No registrada'}</span></p>
                      {selectedCustomer.ruc && (
                        <p><span className="text-light-text/50">RUC:</span> <span className="text-light-text">{selectedCustomer.ruc}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <h3 className="text-light-text font-medium mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-accent" /> Estadísticas
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-display font-bold text-accent">{selectedCustomer.estadisticas?.totalPedidos || 0}</p>
                        <p className="text-light-text/50 text-xs">Total Pedidos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold text-accent">{formatCurrency(selectedCustomer.estadisticas?.totalGastado || 0)}</p>
                        <p className="text-light-text/50 text-xs">Total Gastado</p>
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold text-accent">{formatCurrency(selectedCustomer.estadisticas?.ticketPromedio || 0)}</p>
                        <p className="text-light-text/50 text-xs">Ticket Promedio</p>
                      </div>
                      <div>
                        <p className="text-light-text text-sm">{selectedCustomer.estadisticas?.ultimoPedido ? formatDate(selectedCustomer.estadisticas.ultimoPedido) : 'Nunca'}</p>
                        <p className="text-light-text/50 text-xs">Último Pedido</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historial de Pedidos */}
                <div>
                  <h3 className="text-light-text font-medium mb-3 flex items-center gap-2">
                    <ShoppingCart size={18} className="text-accent" /> Últimos Pedidos
                  </h3>
                  {selectedCustomer.pedidos?.length === 0 ? (
                    <p className="text-light-text/50 text-center py-4">Este cliente aún no ha realizado pedidos.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedCustomer.pedidos?.map(pedido => (
                        <div key={pedido.id} className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-light-text font-medium text-sm">Pedido #{pedido.id.slice(-8)}</p>
                              <p className="text-light-text/50 text-xs">{formatDate(pedido.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-display font-bold text-accent">{formatCurrency(pedido.total)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                pedido.estado === 'ENTREGADO' ? 'bg-green-500/20 text-green-400' :
                                pedido.estado === 'NUEVO' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {pedido.estado}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pedido.items.slice(0, 3).map((item, idx) => (
                              <span key={idx} className="text-light-text/60 text-xs bg-dark-surface px-2 py-1 rounded">
                                {item.cantidad}x {item.producto.nombre}
                              </span>
                            ))}
                            {pedido.items.length > 3 && (
                              <span className="text-light-text/40 text-xs">+{pedido.items.length - 3} más</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Editar Cliente */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-light-text mb-4">Editar Cliente</h2>
            
            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-light-text/80 text-sm mb-1">Nombre *</label>
                <input 
                  type="text" 
                  required
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-light-text/80 text-sm mb-1">Email *</label>
                <input 
                  type="email" 
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-light-text/80 text-sm mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-light-text/80 text-sm mb-1">Dirección</label>
                <textarea 
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({...editForm, direccion: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-light-text/80 text-sm mb-1">RUC</label>
                <input 
                  type="text" 
                  value={editForm.ruc}
                  onChange={(e) => setEditForm({...editForm, ruc: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                  placeholder="10 o 11 dígitos"
                />
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="activo"
                  checked={editForm.activo}
                  onChange={(e) => setEditForm({...editForm, activo: e.target.checked})}
                  className="rounded border-dark-border text-accent focus:ring-accent bg-dark-bg"
                />
                <label htmlFor="activo" className="text-light-text text-sm">Cuenta activa</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-2.5 rounded-lg transition"
                >
                  Guardar Cambios
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-dark-bg border border-dark-border hover:border-accent text-light-text font-bold py-2.5 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}