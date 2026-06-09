// src/components/layout/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Bell, ChevronDown, Package, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { setCartOpen } = useCartStore();
  
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [notificaciones, setNotificaciones] = useState([
    {
      id: 1,
      titulo: 'Stock Bajo',
      mensaje: 'Cemento Portland tiene solo 12 unidades',
      hora: 'Hace 5 min',
      leida: false,
      icon: <Package size={16} />,
      iconBg: 'bg-yellow-500/20'
    },
    {
      id: 2,
      titulo: 'Nuevo Pedido',
      mensaje: 'Recibiste un nuevo pedido #PED-1234',
      hora: 'Hace 1 hora',
      leida: false,
      icon: <ShoppingCart size={16} />,
      iconBg: 'bg-blue-500/20'
    },
    {
      id: 3,
      titulo: 'Pago Confirmado',
      mensaje: 'El pago de S/ 1250.50 fue confirmado',
      hora: 'Hace 3 horas',
      leida: true,
      icon: <DollarSign size={16} />,
      iconBg: 'bg-green-500/20'
    }
  ]);

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarLeida = (idx) => {
    setNotificaciones(prev => prev.map((n, i) => 
      i === idx ? { ...n, leida: true } : n
    ));
  };

  const marcarTodasLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  // ✅ CERRAR MENÚ MÓVIL AL CAMBIAR DE RUTA
  useEffect(() => {
    const handleRouteChange = () => setMobileOpen(false);
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // ✅ CERRAR MENÚS AL HACER CLIC FUERA
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('.user-menu') && 
        !event.target.closest('.search-box') && 
        !event.target.closest('.notif-menu')
      ) {
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ✅ BLOQUEAR SCROLL CUANDO EL MENÚ MÓVIL ESTÁ ABIERTO
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?busqueda=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent rounded-lg flex items-center justify-center group-hover:scale-105 transition">
                <span className="text-dark-bg font-bold text-xs sm:text-sm">F</span>
              </div>
              <span className="font-display text-lg sm:text-xl font-bold text-light-text tracking-wide group-hover:text-accent transition">
                FERREA<span className="text-accent">TIPLANO</span>
              </span>
            </Link>

            {/* NAVEGACIÓN DESKTOP */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Catálogo', path: '/catalogo' },
                { label: 'Cotizador', path: '/cotizador' },
                { label: 'Contacto', path: '/contacto' },
              ].map((item) => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className="px-4 py-2 text-light-text/80 hover:text-accent font-medium transition rounded-lg hover:bg-accent/10"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* ACCIONES DESKTOP */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              
              {/* Buscador Desktop */}
              <div className="relative search-box">
                <form onSubmit={handleSearch} className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar materiales..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-dark-surface border border-dark-border rounded-full pl-9 pr-4 py-2 text-sm text-light-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent w-40 lg:w-64 transition" 
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
                </form>
              </div>

              {/* Notificaciones */}
              <div className="relative notif-menu">
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 text-light-text/70 hover:text-accent transition relative rounded-lg hover:bg-dark-surface"
                  aria-label="Notificaciones"
                >
                  <Bell size={20} />
                  {notificacionesNoLeidas > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-bg animate-pulse"></span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-dark-surface border border-dark-border rounded-xl shadow-2xl z-50 animate-fadeIn overflow-hidden">
                    <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                      <h3 className="font-bold text-light-text text-sm">Notificaciones</h3>
                      <button 
                        onClick={marcarTodasLeidas}
                        className="text-xs text-accent hover:underline font-medium"
                      >
                        Marcar todas leídas
                      </button>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notificaciones.length === 0 ? (
                        <p className="p-6 text-center text-light-text/50 text-sm">
                          No tienes notificaciones
                        </p>
                      ) : (
                        notificaciones.map((notif, idx) => (
                          <div 
                            key={notif.id}
                            className={`p-4 border-b border-dark-border hover:bg-dark-bg/50 transition cursor-pointer ${
                              !notif.leida ? 'bg-accent/5' : ''
                            }`}
                            onClick={() => marcarLeida(idx)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${notif.iconBg}`}>
                                {notif.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-light-text font-medium">{notif.titulo}</p>
                                <p className="text-xs text-light-text/60 mt-1 line-clamp-2">{notif.mensaje}</p>
                                <p className="text-xs text-light-text/40 mt-2">{notif.hora}</p>
                              </div>
                              {!notif.leida && (
                                <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1.5"></span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Usuario / Login */}
              {isAuthenticated() && user ? (
                <div className="relative user-menu">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-3 bg-dark-surface border border-dark-border rounded-full hover:border-accent transition"
                    aria-label="Menú de usuario"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent text-xs font-bold">{getInitials(user.nombre)}</span>
                    </div>
                    <span className="text-sm text-light-text hidden lg:block truncate max-w-[100px]">{user.nombre?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`text-light-text/50 transition ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
                      <Link 
                        to="/perfil" 
                        className="block px-4 py-2 text-sm text-light-text hover:bg-dark-bg hover:text-accent transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        👤 Mi Perfil
                      </Link>
                      {user.rol === 'ADMIN' && (
                        <Link 
                          to="/admin" 
                          className="block px-4 py-2 text-sm text-light-text hover:bg-dark-bg hover:text-accent transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          ⚙️ Panel Admin
                        </Link>
                      )}
                      {user.rol === 'VENDEDOR' && (
                        <Link 
                          to="/vendedor" 
                          className="block px-4 py-2 text-sm text-light-text hover:bg-dark-bg hover:text-accent transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          💼 Panel Vendedor
                        </Link>
                      )}
                      <hr className="border-dark-border my-1" />
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                      >
                        🚪 Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-full hover:bg-accent/20 transition text-sm font-medium"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">Ingresar</span>
                </Link>
              )}

              {/* Carrito */}
              <button 
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-light-text hover:text-accent transition rounded-lg hover:bg-dark-surface"
                aria-label="Abrir carrito"
              >
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-dark-bg text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* BOTONES MÓVIL */}
            <div className="flex md:hidden items-center gap-1 sm:gap-2">
              {/* Carrito Mobile */}
              <button 
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-light-text hover:text-accent transition"
                aria-label="Ver carrito"
              >
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-dark-bg text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              
              {/* Menú Hamburguesa */}
              <button 
                className="p-2 text-light-text hover:text-accent transition" 
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menú"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE */}
        {mobileOpen && (
          <div className="md:hidden bg-dark-surface border-t border-dark-border px-4 py-4 space-y-4 animate-fadeIn max-h-[calc(100vh-4rem)] overflow-y-auto">
            
            {/* Buscador Mobile */}
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Buscar materiales..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-light-text focus:outline-none focus:border-accent"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
            </form>

            {/* Navegación Mobile */}
            <nav className="space-y-2">
              {[
                { label: 'Catálogo', path: '/catalogo', icon: '📦' },
                { label: 'Cotizador', path: '/cotizador', icon: '📋' },
                { label: 'Contacto', path: '/contacto', icon: '📞' },
              ].map((item) => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className="flex items-center gap-3 px-4 py-3 text-light-text hover:text-accent hover:bg-dark-bg rounded-lg transition font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Acciones Mobile */}
            <div className="pt-4 border-t border-dark-border space-y-3">
              {isAuthenticated() && user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent font-bold">{getInitials(user.nombre)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-light-text font-medium truncate">{user.nombre}</p>
                      <p className="text-light-text/50 text-sm">{user.rol}</p>
                    </div>
                  </div>
                  
                  <Link 
                    to="/perfil"
                    className="flex items-center gap-3 px-4 py-3 text-light-text hover:text-accent hover:bg-dark-bg rounded-lg transition font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-xl">👤</span>
                    <span>Mi Perfil</span>
                  </Link>
                  
                  {user.rol === 'ADMIN' && (
                    <Link 
                      to="/admin" 
                      className="flex items-center gap-3 px-4 py-3 bg-accent/10 text-accent rounded-lg font-medium hover:bg-accent/20 transition"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="text-xl">⚙️</span>
                      <span>Panel Admin</span>
                    </Link>
                  )}
                  {user.rol === 'VENDEDOR' && (
                    <Link 
                      to="/vendedor" 
                      className="flex items-center gap-3 px-4 py-3 bg-accent/10 text-accent rounded-lg font-medium hover:bg-accent/20 transition"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="text-xl">💼</span>
                      <span>Panel Vendedor</span>
                    </Link>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/10 transition"
                  >
                    <span className="text-xl">🚪</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-accent text-dark-bg font-bold rounded-lg hover:bg-accent-hover transition"
                  onClick={() => setMobileOpen(false)}
                >
                  <User size={18} />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
              
              <button 
                onClick={() => {
                  setMobileOpen(false);
                  setCartOpen(true);
                }} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dark-bg border border-dark-border text-light-text rounded-lg font-medium hover:border-accent transition"
              >
                <ShoppingCart size={18}/> 
                <span>Ver Carrito</span>
                {itemCount > 0 && (
                  <span className="bg-accent text-dark-bg text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}