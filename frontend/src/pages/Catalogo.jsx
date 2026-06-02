// src/pages/Catalogo.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useCartStore } from '../store/useCartStore'; // ✅ Hook del carrito
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X, ShoppingCart, CheckCircle } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';

// ✅ Imagen por defecto si el producto no tiene foto
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&q=80";

export default function Catalogo() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  // ✅ Hook del carrito para agregar productos
  const addToCart = useCartStore((state) => state.addToCart);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Filtros
  const [filters, setFilters] = useState({
    busqueda: searchParams.get('busqueda') || '',
    categoria: searchParams.get('categoria') || '',
    precioMin: searchParams.get('precioMin') || '',
    precioMax: searchParams.get('precioMax') || '',
    stockBajo: searchParams.get('stockBajo') || '',
    sortBy: searchParams.get('sortBy') || 'nombre',
    sortOrder: searchParams.get('sortOrder') || 'asc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  // Cargar categorías y rango de precios
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catsRes, priceRes] = await Promise.all([
          axios.get('http://localhost:4000/api/products/categories'),
          axios.get('http://localhost:4000/api/products/price-range')
        ]);
        setCategorias(catsRes.data.data);
        setPriceRange(priceRes.data.data);
      } catch (err) {
        console.error('Error cargando metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  // Función para actualizar URL y recargar productos
  const updateURLAndFetch = useCallback((newFilters, page = 1) => {
    const params = new URLSearchParams();
    
    if (newFilters.busqueda) params.set('busqueda', newFilters.busqueda);
    if (newFilters.categoria) params.set('categoria', newFilters.categoria);
    if (newFilters.precioMin) params.set('precioMin', newFilters.precioMin);
    if (newFilters.precioMax) params.set('precioMax', newFilters.precioMax);
    if (newFilters.stockBajo) params.set('stockBajo', newFilters.stockBajo);
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder);
    
    params.set('page', page);
    params.set('limit', '12');
    
    setSearchParams(params);
  }, [setSearchParams]);

  // Fetch productos con debounce para búsqueda
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`http://localhost:4000/api/products?${searchParams.toString()}`);
        
        // ✅ Normalizar precios a número
        const normalizedProducts = data.data.map(product => ({
        ...product,
        precio: Number(product.precio) || 0
      }));
        setProducts(normalizedProducts);
        setProducts(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error cargando productos:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  // Manejar cambios en filtros
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURLAndFetch(newFilters, 1);
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    const emptyFilters = {
      busqueda: '', categoria: '', precioMin: '', precioMax: '', 
      stockBajo: '', sortBy: 'nombre', sortOrder: 'asc'
    };
    setFilters(emptyFilters);
    updateURLAndFetch(emptyFilters, 1);
  };

  // Cambio de página
  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    updateURLAndFetch(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ FUNCIÓN: Agregar producto al carrito con feedback visual
  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Evitar navegar al detalle del producto
    
    addToCart({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: product.imagenes?.[0] || product.imagen || DEFAULT_IMAGE,
      cantidad: 1,
      stock: product.stock
    });
    
    // Mostrar notificación
    setToastMessage(`✅ ${product.nombre} agregado al carrito`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // ✅ Componente de Tarjeta de Producto Inline (con imagen fallback y botón de carrito)
  const ProductCardWithCart = ({ product }) => {
    const imageUrl = product.imagenes?.[0] || product.imagen || DEFAULT_IMAGE;
    
    return (
      <div 
        className="group bg-dark-surface border border-dark-border rounded-xl overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 flex flex-col h-full"
      >
        {/* Imagen del Producto */}
        <div 
          className="relative h-48 bg-dark-bg overflow-hidden cursor-pointer"
          onClick={() => navigate(`/producto/${product.id}`)}
        >
          <img 
            src={imageUrl} 
            alt={product.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            loading="lazy"
          />
          
          {/* Badge de Categoría */}
          <div className="absolute top-2 left-2 bg-dark-bg/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-accent font-bold border border-accent/30">
            {product.categoria}
          </div>
          
          {/* Badge de Stock */}
          {product.stock < 20 && product.stock > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-500/90 text-dark-bg px-2 py-1 rounded text-xs font-bold">
              ¡Poco stock!
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-dark-bg/80 flex items-center justify-center">
              <span className="text-red-400 font-bold text-sm">Agotado</span>
            </div>
          )}
        </div>

        {/* Info del Producto */}
        <div className="p-4 flex flex-col flex-1">
          <h3 
            className="font-medium text-light-text text-sm line-clamp-2 group-hover:text-accent transition cursor-pointer mb-2"
            onClick={() => navigate(`/producto/${product.id}`)}
          >
            {product.nombre}
          </h3>
          
          {/* Descripción corta */}
          {product.descripcion && (
            <p className="text-light-text/50 text-xs line-clamp-2 mb-3 flex-1">
              {product.descripcion}
            </p>
          )}
          
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-xs text-light-text/50">Precio unitario</p>
              <p className="text-xl font-display font-bold text-accent">
                S/ {Number(product.precio).toFixed(2)}
              </p>
            </div>
            
            {/* Botón Agregar al Carrito */}
            <button 
              onClick={(e) => handleAddToCart(e, product)}
              disabled={product.stock === 0}
              className={`p-2.5 rounded-lg transition transform active:scale-95 ${
                product.stock === 0
                  ? 'bg-dark-border text-light-text/40 cursor-not-allowed'
                  : 'bg-accent text-dark-bg hover:bg-accent-hover'
              }`}
              title={product.stock === 0 ? 'Producto agotado' : 'Agregar al carrito'}
            >
              <ShoppingCart size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-4xl font-bold text-light-text mb-4">
          CATÁLOGO DE MATERIALES
        </h1>
        
        {/* Buscador Principal */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-light-text/50" size={20} />
          <input 
            type="text"
            placeholder="Buscar cemento, fierro, herramientas..."
            className="w-full bg-dark-surface border border-dark-border rounded-xl pl-12 pr-4 py-3 text-light-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
            value={filters.busqueda}
            onChange={(e) => handleFilterChange('busqueda', e.target.value)}
          />
        </div>
      </div>

      {/* Barra de Controles */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-dark-border">
        
        {/* Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-light-text hover:border-accent transition"
          >
            <SlidersHorizontal size={18} /> Filtros
          </button>
          
          {filters.categoria && (
            <span className="flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
              {filters.categoria}
              <button onClick={() => handleFilterChange('categoria', '')}><X size={14} /></button>
            </span>
          )}
          {(filters.precioMin || filters.precioMax) && (
            <span className="flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
              Precio: S/ {filters.precioMin || 0} - {filters.precioMax || '∞'}
              <button onClick={() => { handleFilterChange('precioMin', ''); handleFilterChange('precioMax', ''); }}><X size={14} /></button>
            </span>
          )}
        </div>

        {/* Ordenamiento */}
        <div className="flex items-center gap-2">
          <span className="text-light-text/60 text-sm">Ordenar por:</span>
          <select 
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-light-text text-sm focus:outline-none focus:border-accent"
          >
            <option value="nombre-asc">Nombre A-Z</option>
            <option value="nombre-desc">Nombre Z-A</option>
            <option value="precio-asc">Precio: Menor a Mayor</option>
            <option value="precio-desc">Precio: Mayor a Menor</option>
            <option value="stock-desc">Más stock</option>
          </select>
        </div>
      </div>

      {/* Panel de Filtros Avanzados (Desplegable) */}
      {showFilters && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg text-accent">Filtros Avanzados</h3>
            <button onClick={clearFilters} className="text-light-text/60 hover:text-accent text-sm">
              Limpiar todo
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Categoría */}
            <div>
              <label className="block text-light-text/70 text-sm mb-2">Categoría</label>
              <select 
                value={filters.categoria}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
              >
                <option value="">Todas</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="Cajas y buzones prefabricados">Cajas y buzones prefabricados</option>  {/* ✅ AGREGAR */}
              </select>
            </div>

            {/* Precio Mínimo */}
            <div>
              <label className="block text-light-text/70 text-sm mb-2">Precio Mínimo (S/)</label>
              <input 
                type="number" 
                min="0"
                max={priceRange.max}
                value={filters.precioMin}
                onChange={(e) => handleFilterChange('precioMin', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                placeholder="0"
              />
            </div>

            {/* Precio Máximo */}
            <div>
              <label className="block text-light-text/70 text-sm mb-2">Precio Máximo (S/)</label>
              <input 
                type="number" 
                min="0"
                max={priceRange.max}
                value={filters.precioMax}
                onChange={(e) => handleFilterChange('precioMax', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                placeholder={priceRange.max}
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-light-text/70 text-sm mb-2">Disponibilidad</label>
              <select 
                value={filters.stockBajo}
                onChange={(e) => handleFilterChange('stockBajo', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
              >
                <option value="">Todos</option>
                <option value="disponible">Solo disponibles</option>
                <option value="true">Stock bajo (&lt;50)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      <div className="mb-4 text-light-text/60 text-sm">
        {loading ? 'Cargando...' : `${pagination?.total || 0} productos encontrados`}
      </div>

      {/* Grid de Productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-dark-surface border border-dark-border rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Filter size={48} className="mx-auto text-light-text/30 mb-4" />
          <p className="text-light-text/60 mb-4">No se encontraron productos con esos filtros</p>
          <button onClick={clearFilters} className="text-accent hover:underline">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCardWithCart key={product.id} product={product} />
            ))}
          </div>

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="p-2 rounded-lg border border-dark-border text-light-text hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} />
              </button>
              
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === pagination.totalPages || Math.abs(page - pagination.page) <= 2) {
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        page === pagination.page 
                          ? 'bg-accent text-dark-bg' 
                          : 'bg-dark-surface border border-dark-border text-light-text hover:border-accent'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === 2 && pagination.page > 4) {
                  return <span key="dots1" className="text-light-text/40 px-2">...</span>;
                }
                if (page === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 4) {
                  return <span key="dots2" className="text-light-text/40 px-2">...</span>;
                }
                return null;
              })}
              
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="p-2 rounded-lg border border-dark-border text-light-text hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ✅ Toast de Notificación */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fadeIn z-50">
          <CheckCircle size={20} />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}