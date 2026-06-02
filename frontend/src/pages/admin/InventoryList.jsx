// src/pages/admin/InventoryList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown, 
  Search, Filter, Plus, Minus, History, RefreshCw
} from 'lucide-react';

export default function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({
    categoria: '',
    stockBajo: '',
    busqueda: ''
  });
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    tipo: 'entrada',
    cantidad: '',
    motivo: ''
  });
  const [movements, setMovements] = useState([]);

  // Cargar inventario
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      const { data } = await axios.get(`http://localhost:4000/api/inventory?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(data.data);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar alertas de stock bajo
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:4000/api/inventory/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(data.data);
    } catch (err) {
      console.error('Error cargando alertas:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
  }, [filters]);

  // Abrir modal de ajuste
  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustForm({ tipo: 'entrada', cantidad: '', motivo: '' });
    setShowAdjustModal(true);
  };

  // Ajustar stock
  const handleAdjustStock = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:4000/api/inventory/adjust', {
        productId: selectedProduct.id,
        cantidad: parseInt(adjustForm.cantidad),
        motivo: adjustForm.motivo,
        tipo: adjustForm.tipo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowAdjustModal(false);
      fetchInventory();
      fetchAlerts();
    } catch (err) {
      alert('Error ajustando stock: ' + (err.response?.data?.error || err.message));
    }
  };

  // Ver historial de movimientos
  const viewMovements = async (product) => {
    setSelectedProduct(product);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:4000/api/inventory/movements?productId=${product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovements(data.data);
      setShowMovementsModal(true);
    } catch (err) {
      alert('Error cargando movimientos');
    }
  };

  // Helpers UI
  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Agotado', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (stock < 20) return { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (stock < 50) return { label: 'Bajo', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: 'Normal', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl text-light-text">Control de Inventario</h1>
          <p className="text-light-text/60 text-sm">Gestiona el stock de productos y movimientos</p>
        </div>
        <button 
          onClick={fetchInventory} 
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition"
        >
          <RefreshCw size={18} /> Actualizar
        </button>
      </div>

      {/* Alertas de Stock */}
      {alerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-400" size={20} />
            <h3 className="text-red-400 font-bold">Alertas de Stock Bajo</h3>
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{alerts.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {alerts.slice(0, 6).map(product => (
              <div key={product.id} className="bg-dark-bg p-3 rounded-lg border border-red-500/20">
                <p className="text-light-text text-sm truncate">{product.nombre}</p>
                <p className="text-red-400 font-bold text-lg">{product.stock} unid.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
          <input 
            type="text" 
            placeholder="Buscar producto..." 
            value={filters.busqueda}
            onChange={(e) => setFilters({...filters, busqueda: e.target.value})}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
          />
        </div>
        <select 
          value={filters.categoria}
          onChange={(e) => setFilters({...filters, categoria: e.target.value})}
          className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
        >
          <option value="">Todas las categorías</option>
          <option value="Cemento">Cemento</option>
          <option value="Fierro">Fierro</option>
          <option value="Ladrillos">Ladrillos</option>
          <option value="Plomería">Plomería</option>
          <option value="Electricidad">Electricidad</option>
        </select>
        <select 
          value={filters.stockBajo}
          onChange={(e) => setFilters({...filters, stockBajo: e.target.value})}
          className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
        >
          <option value="">Todo el stock</option>
          <option value="true">Solo stock bajo</option>
        </select>
      </div>

      {/* Tabla de Inventario */}
      {loading ? (
        <div className="text-center py-20 text-accent">Cargando inventario...</div>
      ) : inventory.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <Package className="mx-auto text-light-text/30 mb-4" size={48} />
          <p className="text-light-text/60">No se encontraron productos.</p>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Producto</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Categoría</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Precio</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Stock</th>
                  <th className="text-left p-4 text-light-text/70 font-medium text-sm">Estado</th>
                  <th className="text-right p-4 text-light-text/70 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {inventory.map(product => {
                  const status = getStockStatus(product.stock);
                  return (
                    <tr key={product.id} className="hover:bg-dark-bg/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.imagenes[0] || 'https://via.placeholder.com/40'} 
                            alt={product.nombre}
                            className="w-10 h-10 object-cover rounded bg-dark-surface"
                          />
                          <div>
                            <p className="text-light-text font-medium text-sm">{product.nombre}</p>
                            <p className="text-light-text/50 text-xs truncate max-w-[200px]">{product.descripcion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-light-text/70 text-sm">{product.categoria}</td>
                      <td className="p-4 font-display font-bold text-accent">
                        S/ {Number(product.precio).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className="text-light-text font-medium">{product.stock} unid.</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openAdjustModal(product)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition"
                            title="Ajustar Stock"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => viewMovements(product)}
                            className="p-2 text-light-text/70 hover:text-accent transition"
                            title="Ver Historial"
                          >
                            <History size={18} />
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
      )}

      {/* Modal: Ajustar Stock */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowAdjustModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-light-text mb-4">Ajustar Stock</h2>
            <p className="text-light-text/60 text-sm mb-4">{selectedProduct.nombre}</p>
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-light-text/80 text-sm mb-1">Tipo de Movimiento</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({...adjustForm, tipo: 'entrada'})}
                    className={`flex-1 py-2 rounded-lg border transition ${
                      adjustForm.tipo === 'entrada'
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-dark-bg border-dark-border text-light-text/70'
                    }`}
                  >
                    <TrendingUp size={18} className="mx-auto mb-1" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({...adjustForm, tipo: 'salida'})}
                    className={`flex-1 py-2 rounded-lg border transition ${
                      adjustForm.tipo === 'salida'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-dark-bg border-dark-border text-light-text/70'
                    }`}
                  >
                    <TrendingDown size={18} className="mx-auto mb-1" />
                    Salida
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-light-text/80 text-sm mb-1">Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={adjustForm.cantidad}
                  onChange={(e) => setAdjustForm({...adjustForm, cantidad: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-light-text/80 text-sm mb-1">Motivo</label>
                <textarea 
                  required
                  value={adjustForm.motivo}
                  onChange={(e) => setAdjustForm({...adjustForm, motivo: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                  placeholder="Ej: Compra a proveedor, Devolución, Pérdida, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-2.5 rounded-lg transition"
                >
                  Confirmar Ajuste
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 bg-dark-bg border border-dark-border hover:border-accent text-light-text font-bold py-2.5 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Historial de Movimientos */}
      {showMovementsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowMovementsModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-border">
              <h2 className="font-display text-xl text-light-text">Historial de Movimientos</h2>
              <p className="text-light-text/60 text-sm">{selectedProduct.nombre}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {movements.length === 0 ? (
                <p className="text-light-text/50 text-center py-8">No hay movimientos registrados</p>
              ) : (
                <div className="space-y-3">
                  {movements.map((mov, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      mov.tipo === 'entrada' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {mov.tipo === 'entrada' ? (
                            <TrendingUp className="text-green-400" size={18} />
                          ) : (
                            <TrendingDown className="text-red-400" size={18} />
                          )}
                          <span className={`font-medium ${
                            mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad} unidades
                          </span>
                        </div>
                        <span className="text-light-text/50 text-xs">
                          {new Date(mov.fecha).toLocaleString('es-PE')}
                        </span>
                      </div>
                      <p className="text-light-text text-sm mb-1">{mov.motivo}</p>
                      <p className="text-light-text/50 text-xs">
                        Stock: {mov.stockAnterior} → {mov.stockNuevo}
                      </p>
                      {mov.usuario && (
                        <p className="text-light-text/50 text-xs mt-1">
                          Por: {mov.usuario.nombre}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-dark-border">
              <button 
                onClick={() => setShowMovementsModal(false)}
                className="w-full bg-dark-bg border border-dark-border hover:border-accent text-light-text font-bold py-2.5 rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}