// src/components/ui/ProductCard.jsx
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';

// ✅ Imagen por defecto si el producto no tiene foto
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&q=80";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  // ✅ Manejar imagen con fallback
  const imageUrl = product.imagenes?.[0] || product.imagen || DEFAULT_IMAGE;

  // ✅ Agregar al carrito con prevención de propagación
  const handleAddToCart = (e) => {
    e.stopPropagation(); // Evitar navegar al detalle al hacer clic en el botón
    
    if (!useAuthStore.getState().isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    addToCart({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: imageUrl,
      cantidad: 1,
      stock: product.stock
    });
  };

  // Navegar al detalle del producto
  const goToDetail = () => {
    navigate(`/producto/${product.id}`);
  };

  return (
    <div 
      className="group bg-dark-surface border border-dark-border rounded-xl overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 flex flex-col h-full cursor-pointer"
      onClick={goToDetail}
    >
      {/* Imagen del Producto */}
      <div className="relative h-48 bg-dark-bg overflow-hidden">
        <img 
          src={imageUrl} 
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }} // ✅ Fallback si falla la carga
          loading="lazy" // ✅ Carga diferida para mejor performance
        />
        
        {/* Badge de Categoría */}
        <div className="absolute top-2 left-2 bg-dark-bg/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-accent font-bold border border-accent/30">
          {product.categoria}
        </div>
        
        {/* Badge de Stock */}
        {product.stock < 20 && product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-yellow-500/90 text-dark-bg px-2 py-1 rounded text-xs font-bold shadow-lg">
            ¡Poco stock!
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-red-400 font-bold text-sm bg-dark-bg/50 px-3 py-1 rounded-full border border-red-500/30">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Contenido del Producto */}
      <div className="p-4 flex flex-col flex-1">
        {/* Nombre del Producto */}
        <h3 className="font-medium text-light-text text-sm line-clamp-2 group-hover:text-accent transition mb-2">
          {product.nombre}
        </h3>
        
        {/* Descripción corta (opcional) */}
        {product.descripcion && (
          <p className="text-light-text/50 text-xs line-clamp-2 mb-3 flex-1">
            {product.descripcion}
          </p>
        )}
        
        {/* Precio y Botón */}
        <div className="flex items-end justify-between mt-auto pt-3 border-t border-dark-border">
          <div>
            <p className="text-xs text-light-text/50">Precio unitario</p>
            <p className="text-xl font-display font-bold text-accent">
              S/ {Number(product.precio).toFixed(2)}
            </p>
          </div>
          
          {/* Botón Agregar al Carrito */}
          <button 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`p-2.5 rounded-lg transition transform active:scale-95 flex items-center justify-center ${
              product.stock === 0
                ? 'bg-dark-border text-light-text/40 cursor-not-allowed'
                : 'bg-accent text-dark-bg hover:bg-accent-hover hover:scale-105'
            }`}
            title={product.stock === 0 ? 'Producto agotado' : 'Agregar al carrito'}
            aria-label={`Agregar ${product.nombre} al carrito`}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}