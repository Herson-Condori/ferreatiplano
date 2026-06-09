// src/pages/ProductDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, Package, Truck, Shield, Zap } from 'lucide-react'; // ✅ Agregado Zap
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`http://localhost:4000/api/products/${id}`);
        setProduct(data.data);
        setSelectedImage(0);
      } catch (err) {
        console.error('Error cargando producto:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-accent">Cargando producto...</div>;
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-light-text/60 mb-4">Producto no encontrado</p>
        <button 
          onClick={() => navigate('/catalogo')}
          className="text-accent hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={18} /> Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <button 
        onClick={() => navigate('/catalogo')}
        className="flex items-center gap-2 text-light-text/60 hover:text-accent mb-6 transition"
      >
        <ArrowLeft size={18} /> Volver al catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Galería de Imágenes */}
        <div className="space-y-4">
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden aspect-square">
            <img 
              src={product.imagenes?.[selectedImage] || 'https://via.placeholder.com/600x600'} 
              alt={product.nombre}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Miniaturas */}
          {product.imagenes && product.imagenes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.imagenes.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition ${
                    selectedImage === index ? 'border-accent' : 'border-dark-border hover:border-light-text/50'
                  }`}
                >
                  <img src={img} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del Producto */}
        <div className="space-y-6">
          <div>
            <span className="text-accent text-sm font-bold uppercase tracking-wide">
              {product.categoria}
            </span>
            <h1 className="font-display text-3xl font-bold text-light-text mt-2 mb-4">
              {product.nombre}
            </h1>
            <p className="text-light-text/70 leading-relaxed">
              {product.descripcion || 'Sin descripción disponible.'}
            </p>
          </div>

          {/* Precio y Stock */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-light-text/60 text-sm">Precio unitario</p>
                <p className="font-display text-4xl font-bold text-accent">
                  S/ {Number(product.precio).toFixed(2)}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                product.stock > 50 
                  ? 'bg-green-500/20 text-green-400' 
                  : product.stock > 0 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {product.stock > 50 
                  ? '✅ En stock' 
                  : product.stock > 0 
                    ? `⚠️ Solo ${product.stock} unidades` 
                    : '❌ Agotado'}
              </div>
            </div>

            {/* Selector de Cantidad */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-light-text/70">Cantidad:</span>
              <div className="flex items-center border border-dark-border rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-light-text hover:text-accent transition disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="px-4 py-2 text-light-text font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2 text-light-text hover:text-accent transition disabled:opacity-50"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
              <span className="text-light-text/50 text-sm">
                {product.stock} disponibles
              </span>
            </div>

            {/* ✅ BOTONES DE ACCIÓN (Compra Rápida + Carrito) */}
            <div className="space-y-3">
              
              {/* 1. Compra Rápida (Nuevo) */}
              <button
                onClick={() => {
                  if (!useAuthStore.getState().isAuthenticated()) {
                    navigate('/login');
                  } else {
                    navigate(`/checkout/rapido/${product.id}?cantidad=${quantity}`);
                  }
                }}
                disabled={product.stock === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-900/20"
              >
                <Zap size={20} />
                {product.stock > 0 ? 'Compra Rápida (Pagar Ahora)' : 'Producto Agotado'}
              </button>

              {/* 2. Agregar al Carrito (Existente) */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-accent hover:bg-accent-hover text-dark-bg font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <ShoppingCart size={20} />
                {product.stock > 0 ? 'Agregar al Carrito' : 'Producto Agotado'}
              </button>
              
            </div>

            {/* Total estimado */}
            {quantity > 1 && (
              <p className="text-center text-light-text/60 mt-3">
                Total estimado: <span className="text-accent font-bold">S/ {(product.precio * quantity).toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Beneficios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-light-text/70">
              <Truck size={20} className="text-accent" />
              <span className="text-sm">Delivery a Juliaca</span>
            </div>
            <div className="flex items-center gap-3 text-light-text/70">
              <Package size={20} className="text-accent" />
              <span className="text-sm">Garantía de calidad</span>
            </div>
            <div className="flex items-center gap-3 text-light-text/70">
              <Shield size={20} className="text-accent" />
              <span className="text-sm">Pago seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}