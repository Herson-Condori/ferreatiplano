// src/pages/admin/VendorsList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Mail, Phone, Search, Plus, Edit, ToggleRight, ToggleLeft,
  RefreshCw, X, EyeOff
} from 'lucide-react';

export default function VendorsList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ busqueda: '', estado: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  
  // Estados de formularios
  const [createForm, setCreateForm] = useState({ nombre: '', email: '', password: '', telefono: '' });
  const [editForm, setEditForm] = useState({ nombre: '', email: '', telefono: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Cargar vendedores
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      const { data } = await axios.get(`http://localhost:4000/api/vendors?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(data.data);
    } catch (err) {
      console.error('Error cargando vendedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [filters]);

  // Crear vendedor
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:4000/api/vendors', createForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateModal(false);
      setCreateForm({ nombre: '', email: '', password: '', telefono: '' });
      fetchVendors();
    } catch (err) {
      alert('Error creando: ' + (err.response?.data?.error || err.message));
    }
  };

  // Abrir edición
  const openEdit = (vendor) => {
    setSelectedVendor(vendor);
    setEditForm({ nombre: vendor.nombre, email: vendor.email, telefono: vendor.telefono || '' });
    setShowEditModal(true);
  };

  // Guardar edición
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:4000/api/vendors/${selectedVendor.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      fetchVendors();
    } catch (err) {
      alert('Error actualizando: ' + (err.response?.data?.error || err.message));
    }
  };

  // Toggle Status
  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4000/api/vendors/${id}/status`, 
        { activo: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVendors();
    } catch (err) {
      alert('Error actualizando estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-light-text">Gestión de Vendedores</h1>
          <p className="text-light-text/60 text-sm">Administra cuentas del equipo de ventas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchVendors} className="p-2 bg-dark-surface border border-dark-border rounded-lg hover:border-accent text-light-text transition">
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-dark-bg font-bold rounded-lg hover:bg-accent-hover transition"
          >
            <Plus size={18} /> Nuevo Vendedor
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
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
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-20 text-accent">Cargando...</div>
      ) : vendors.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <Users className="mx-auto text-light-text/30 mb-4" size={48} />
          <p className="text-light-text/60">No hay vendedores registrados.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="text-left p-4 text-light-text/70 text-sm">Vendedor</th>
                  <th className="text-left p-4 text-light-text/70 text-sm">Contacto</th>
                  <th className="text-left p-4 text-light-text/70 text-sm">Estado</th>
                  <th className="text-left p-4 text-light-text/70 text-sm">Creado</th>
                  <th className="text-right p-4 text-light-text/70 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-dark-bg/50 transition">
                    <td className="p-4">
                      <p className="text-light-text font-medium">{v.nombre}</p>
                    </td>
                    <td className="p-4 text-sm text-light-text/70">
                      <p className="flex items-center gap-1"><Mail size={12} /> {v.email}</p>
                      {v.telefono && <p className="flex items-center gap-1 mt-1"><Phone size={12} /> {v.telefono}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${v.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-light-text/50 text-sm">{new Date(v.createdAt).toLocaleDateString('es-PE')}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(v)} className="p-2 text-blue-400 hover:text-blue-300"><Edit size={18} /></button>
                        <button onClick={() => handleToggle(v.id, v.activo)} className={`p-2 transition ${v.activo ? 'text-red-400' : 'text-green-400'}`}>
                          {v.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear Vendedor */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl text-light-text mb-4">Nuevo Vendedor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input required type="text" placeholder="Nombre Completo" value={createForm.nombre} onChange={e => setCreateForm({...createForm, nombre: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <input required type="email" placeholder="Email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} placeholder="Contraseña" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 pr-10 text-light-text focus:outline-none focus:border-accent" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text/50"><EyeOff size={18} /></button>
              </div>
              <input type="tel" placeholder="Teléfono" value={createForm.telefono} onChange={e => setCreateForm({...createForm, telefono: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-dark-bg font-bold py-2.5 rounded-lg">Crear</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-dark-bg border border-dark-border text-light-text font-bold py-2.5 rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Vendedor */}
      {showEditModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl text-light-text mb-4">Editar Vendedor</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input required type="text" value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <input type="tel" value={editForm.telefono} onChange={e => setEditForm({...editForm, telefono: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-dark-bg font-bold py-2.5 rounded-lg">Guardar</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-dark-bg border border-dark-border text-light-text font-bold py-2.5 rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}