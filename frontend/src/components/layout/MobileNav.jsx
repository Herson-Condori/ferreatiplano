import { Home, ShoppingCart, User, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';

export default function MobileNav() {
  const location = useLocation();
  const { setCartOpen, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  
  // Solo mostrar en móvil
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border z-50 shadow-lg">
      <div className="grid grid-cols-4 gap-1">
        <Link to="/" className={`flex flex-col items-center p-3 ${location.pathname === '/' ? 'text-accent' : 'text-light-text/75 hover:text-light-text'}`}>
          <Home size={20} />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Inicio</span>
        </Link>
        
        <Link to="/catalogo" className={`flex flex-col items-center p-3 ${location.pathname === '/catalogo' ? 'text-accent' : 'text-light-text/75 hover:text-light-text'}`}>
          <Package size={20} />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Catálogo</span>
        </Link>
        
        <button 
          onClick={() => setCartOpen(true)}
          className="flex flex-col items-center p-3 text-light-text/75 hover:text-light-text focus:outline-none relative"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-dark-bg text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Carrito</span>
        </button>
        
        <Link to="/perfil" className={`flex flex-col items-center p-3 ${location.pathname === '/perfil' ? 'text-accent' : 'text-light-text/75 hover:text-light-text'}`}>
          <User size={20} />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}