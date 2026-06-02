// src/pages/admin/SuppliersList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Mail, Phone, MapPin, Package, Search, Plus, Edit, ToggleRight, ToggleLeft, RefreshCw, X } from 'lucide-react';

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ busqueda: '', estado: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({ nombre: '', ruc: '', contacto: '', email: '', telefono: '', direccion: '', productosSuministra: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      const { data } = await axios.get(`http://localhost:4000/api/suppliers?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingSupplier 
        ? `http://localhost:4000/api/suppliers/${editingSupplier.id}`
        : 'http://localhost:4000/api/suppliers';
      const method = editingSupplier ? 'put' : 'post';
      
      await axios[method](url, form, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false);
      setEditingSupplier(null);
      setForm({ nombre: '', ruc: '', contacto: '', email: '', telefono: '', direccion: '', productosSuministra: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const openEdit = (sup) => {
    setEditingSupplier(sup);
    setForm({ nombre: sup.nombre, ruc: sup.ruc || '', contacto: sup.contacto || '', email: sup.email || '', telefono: sup.telefono || '', direccion: sup.direccion || '', productosSuministra: sup.productosSuministra || '' });
    setShowModal(true);
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4000/api/suppliers/${id}/status`, { activo: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Error actualizando estado'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-light-text">Gestión de Proveedores</h1>
          <p className="text-light-text/60 text-sm">Administra tus proveedores y contactos de abastecimiento</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 bg-dark-surface border border-dark-border rounded-lg hover:border-accent text-light-text transition"><RefreshCw size={20} /></button>
          <button onClick={() => { setEditingSupplier(null); setForm({ nombre: '', ruc: '', contacto: '', email: '', telefono: '', direccion: '', productosSuministra: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-accent text-dark-bg font-bold rounded-lg hover:bg-accent-hover transition"><Plus size={18} /> Nuevo Proveedor</button>
        </div>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
          <input type="text" placeholder="Buscar por nombre, contacto o email..." value={filters.busqueda} onChange={e => setFilters({...filters, busqueda: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
        </div>
        <select value={filters.estado} onChange={e => setFilters({...filters, estado: e.target.value})} className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent">
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {loading ? <div className="text-center py-20 text-accent">Cargando...</div> : suppliers.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <Store className="mx-auto text-light-text/30 mb-4" size={48} />
          <p className="text-light-text/60">No hay proveedores registrados.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="text-left p-4 text-light-text/70 text-sm">Proveedor</th>
                  <th className="text-left p-4 text-light-text/70 text-sm">Contacto</th>
                  <th className="text-left p-4 text-light-text/70 text-sm">Productos</th>
                  <th className="text-left p-4 text-light-text/70 text-sm">Estado</th>
                  <th className="text-right p-4 text-light-text/70 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-dark-bg/50 transition">
                    <td className="p-4">
                      <p className="text-light-text font-medium">{s.nombre}</p>
                      {s.ruc && <p className="text-light-text/50 text-xs">RUC: {s.ruc}</p>}
                    </td>
                    <td className="p-4 text-sm text-light-text/70">
                      {s.contacto && <p className="flex items-center gap-1"><Mail size={12} /> {s.email || s.contacto}</p>}
                      {s.telefono && <p className="flex items-center gap-1 mt-1"><Phone size={12} /> {s.telefono}</p>}
                    </td>
                    <td className="p-4">
                      <span className="text-light-text text-xs bg-dark-bg px-2 py-1 rounded border border-dark-border truncate max-w-[150px] block">{s.productosSuministra || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${s.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{s.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="p-2 text-blue-400 hover:text-blue-300"><Edit size={18} /></button>
                        <button onClick={() => handleToggle(s.id, s.activo)} className={`p-2 transition ${s.activo ? 'text-red-400' : 'text-green-400'}`}>{s.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl text-light-text">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button onClick={() => setShowModal(false)} className="text-light-text/50 hover:text-light-text"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required type="text" placeholder="Nombre de la Empresa *" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="RUC" value={form.ruc} onChange={e => setForm({...form, ruc: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                <input type="text" placeholder="Persona de Contacto" value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                <input type="tel" placeholder="Teléfono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              </div>
              <input type="text" placeholder="Dirección" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <input type="text" placeholder="Productos que suministra (ej: Cemento, Fierro)" value={form.productosSuministra} onChange={e => setForm({...form, productosSuministra: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent text-dark-bg font-bold py-2.5 rounded-lg hover:bg-accent-hover transition">Guardar</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-dark-bg border border-dark-border text-light-text font-bold py-2.5 rounded-lg hover:border-accent transition">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}