// src/components/layout/CartDrawer.jsx
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  
  // ✅ Calcular totales convirtiendo precios a números
  const subtotal = items.reduce((sum, item) => {
    const precio = Number(item.precio) || 0;
    const cantidad = item.cantidad || 1;
    return sum + (precio * cantidad);
  }, 0);
  
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      onClose();
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-dark-surface border-l border-dark-border z-50 shadow-2xl transform transition-transform flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} className="text-accent" />
            <h2 className="font-display text-xl font-bold text-light-text">
              Tu Carrito
            </h2>
            {items.length > 0 && (
              <span className="bg-accent text-dark-bg text-xs font-bold px-2 py-1 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-light-text/60 hover:text-light-text transition rounded-lg hover:bg-dark-bg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ShoppingCart size={64} className="text-light-text/20 mb-4" />
              <p className="text-light-text/60 text-lg mb-2">Tu carrito está vacío</p>
              <p className="text-light-text/40 text-sm mb-6">
                Agrega productos del catálogo
              </p>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/catalogo');
                }}
                className="bg-accent hover:bg-accent-hover text-dark-bg font-bold py-2 px-6 rounded-lg transition flex items-center gap-2"
              >
                Ir al Catálogo
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                // ✅ Convertir precio a número
                const precio = Number(item.precio) || 0;
                const cantidad = item.cantidad || 1;
                
                return (
                  <div 
                    key={item.id} 
                    className="bg-dark-bg border border-dark-border rounded-xl p-4 flex gap-4"
                  >
                    {/* Imagen */}
                    <div className="w-20 h-20 bg-dark-surface rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.imagen || item.imagenes?.[0] || 'https://via.placeholder.com/80'} 
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-light-text text-sm line-clamp-2 mb-1">
                        {item.nombre}
                      </h3>
                      <p className="text-accent font-display font-bold text-lg">
                        {/* ✅ Usar Number() antes de toFixed */}
                        S/ {precio.toFixed(2)}
                      </p>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-dark-border rounded-lg">
                          <button 
                            onClick={() => updateQuantity(item.id, cantidad - 1)}
                            className="p-1 text-light-text/60 hover:text-accent transition"
                            disabled={cantidad <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1 text-light-text font-medium text-sm">
                            {cantidad}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, cantidad + 1)}
                            className="p-1 text-light-text/60 hover:text-accent transition"
                            disabled={cantidad >= (item.stock || 999)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Resumen y Checkout */}
        {items.length > 0 && (
          <div className="border-t border-dark-border p-6 space-y-4 bg-dark-bg/50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-light-text/60">
                <span>Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-light-text/60">
                <span>IGV (18%)</span>
                <span>S/ {igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-display font-bold text-accent pt-2 border-t border-dark-border">
                <span>Total</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              Proceder al Pago
              <ArrowRight size={20} />
            </button>

            <button 
              onClick={() => {
                if (confirm('¿Vaciar carrito?')) {
                  clearCart();
                  onClose();
                }
              }}
              className="w-full text-light-text/60 hover:text-red-400 text-sm transition"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}