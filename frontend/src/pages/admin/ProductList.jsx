import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, Trash2, Plus, Search } from 'lucide-react';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      if (categoria) params.append('categoria', categoria);

      const { data } = await axios.get(`http://localhost:4000/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(data.data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [busqueda, categoria]);

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Error eliminando producto');
    }
  };

  const categorias = ['Cemento', 'Fierro', 'Ladrillos', 'Plomería', 'Electricidad', 'Herramientas', 'Pinturas', 'Madera', 'Cajas y buzones prefabricados', 'Otros'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl text-accent">Gestión de Productos</h1>
        <button 
          onClick={() => navigate('/admin/productos/nuevo')}
          className="bg-accent hover:bg-accent-hover text-dark-bg font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-dark-surface border border-dark-border p-4 rounded-xl mb-6 flex gap-4">
        <div className="flex-grow relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" size={18} />
          <input 
            type="text" 
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-light-text focus:outline-none focus:border-accent"
          />
        </div>
        <select 
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-light-text focus:outline-none focus:border-accent"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-20 text-accent">Cargando productos...</div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="text-left p-4 text-light-text/70 font-medium">Producto</th>
                  <th className="text-left p-4 text-light-text/70 font-medium">Categoría</th>
                  <th className="text-left p-4 text-light-text/70 font-medium">Precio</th>
                  <th className="text-left p-4 text-light-text/70 font-medium">Stock</th>
                  <th className="text-left p-4 text-light-text/70 font-medium">Estado</th>
                  <th className="text-right p-4 text-light-text/70 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-dark-bg/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.imagenes[0] || 'https://via.placeholder.com/50'} 
                          alt={product.nombre}
                          className="w-12 h-12 object-cover rounded bg-dark-surface"
                        />
                        <div>
                          <p className="font-medium text-light-text">{product.nombre}</p>
                          <p className="text-sm text-light-text/50 truncate max-w-xs">{product.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-light-text">{product.categoria}</td>
                    <td className="p-4 font-display font-bold text-accent">S/ {Number(product.precio).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        product.stock < 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {product.stock} unid.
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        product.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {product.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/admin/productos/editar/${product.id}`)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}