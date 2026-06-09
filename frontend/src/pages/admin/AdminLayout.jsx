// src/pages/admin/AdminLayout.jsx
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, ShoppingCart, Package, Warehouse, Store,
  Users, UserCog, FileText, BarChart3, Settings, LogOut,
  Menu, X, Bell, AlertTriangle, Search, ChevronDown
} from 'lucide-react'; // ✅ Store ahora está importado

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: ShoppingCart, label: 'Pedidos', path: '/admin/pedidos' },
    { icon: Package, label: 'Productos', path: '/admin/productos' },
    { icon: Warehouse, label: 'Inventario', path: '/admin/inventario' },
    { icon: Store, label: 'Proveedores', path: '/admin/proveedores' }, // ✅ Ahora funciona
    { icon: Users, label: 'Clientes', path: '/admin/clientes' },
    { icon: UserCog, label: 'Vendedores', path: '/admin/vendedores' },
    { icon: FileText, label: 'Facturación', path: '/admin/facturas' },
    { icon: BarChart3, label: 'Reportes', path: '/admin/reportes' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      
      {/* SIDEBAR */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-dark-surface border-r border-dark-border transition-all duration-300 flex flex-col fixed md:relative h-full z-40`}
        aria-label="Menú de administración"
      >
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-border">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-display text-xl font-bold text-light-text group-hover:text-accent transition">
                FERREA<span className="text-accent">LTIPLANO</span>
              </span>
            </Link>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-dark-bg text-light-text/70 hover:text-accent transition"
            aria-label={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 overflow-y-auto" role="navigation">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 mb-1 rounded-lg transition group ${
                  isActive 
                    ? 'bg-accent/10 text-accent border-l-4 border-accent' 
                    : 'text-light-text/70 hover:bg-dark-bg hover:text-light-text'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={20} className={isActive ? 'text-accent' : 'group-hover:text-accent transition'} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-dark-border relative">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-bold text-sm">{getInitials(user?.nombre)}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-light-text truncate">{user?.nombre || 'Administrador'}</p>
                <p className="text-xs text-light-text/50 truncate">{user?.email || 'admin@ferrealtiplano.pe'}</p>
              </div>
            )}
            {sidebarOpen && (
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-1 rounded hover:bg-dark-bg text-light-text/50 hover:text-light-text transition"
                aria-label="Menú de usuario"
              >
                <ChevronDown size={16} />
              </button>
            )}
          </div>

          {/* User Dropdown Menu */}
          {sidebarOpen && userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => { navigate('/perfil'); setUserMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-light-text hover:bg-dark-bg transition flex items-center gap-2"
              >
                <Users size={16} /> Mi Perfil
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition flex items-center gap-2 border-t border-dark-border"
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay para móvil cuando sidebar está abierto */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR */}
        <header className="h-16 bg-dark-surface border-b border-dark-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-dark-bg text-light-text/70 hover:text-accent transition"
              aria-label="Toggle menú"
            >
              <Menu size={20} />
            </button>
            
            <div>
              <h1 className="font-display text-lg md:text-xl font-bold text-light-text">
                {menuItems.find(m => location.pathname === m.path || location.pathname.startsWith(m.path + '/'))?.label || 'Dashboard'}
              </h1>
              <span className="text-light-text/50 text-xs md:text-sm hidden sm:block">
                {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Toggle */}
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg hover:bg-dark-bg text-light-text/70 hover:text-accent transition"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Search Bar (expandable) */}
            {searchOpen && (
              <div className="absolute top-full right-4 mt-2 w-64 md:w-80 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50 p-3 animate-fadeIn">
                <input 
                  type="text" 
                  placeholder="Buscar productos, pedidos..." 
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-light-text focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>
            )}

            {/* Stock Alerts */}
            <Link 
              to="/admin/inventario"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition"
            >
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-sm text-red-400 font-medium">5 alertas</span>
            </Link>

            {/* Time */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-light-text">
                {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-dark-bg text-light-text/70 hover:text-accent transition relative" aria-label="Notificaciones">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}