// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

// 🎨 Layouts Principales
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';
import MobileNav from './components/layout/MobileNav';

// 👑 Layout Admin (con sidebar profesional)
import AdminLayout from './pages/admin/AdminLayout';

// 🔐 Auth & Routing
import LoginForm from './components/auth/LoginForm';
import RoleProtectedRoute from './components/routing/RoleProtectedRoute';

// 🏠 Página Principal (Home con Hero + Secciones adicionales)
import Home from './pages/Home';

// 📄 Pages Públicas
import Catalogo from './pages/Catalogo';
import Checkout from './pages/Checkout';
import Contacto from './pages/Contacto';
import Cotizador from './pages/Cotizador';
import ProductDetail from './pages/ProductDetail';
import RegisterForm from './pages/auth/RegisterForm';

// 👥 Pages de Dashboard por Rol
import Perfil from './pages/Perfil';
import DashboardVendedor from './pages/vendedor/Dashboard';
import QuickCheckout from './pages/QuickCheckout';
import CheckoutConfirmation from './pages/CheckoutConfirmation';
import DashboardAdmin from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import InvoiceList from './pages/admin/InvoiceList';
import OrdersList from './pages/admin/OrdersList';
import InventoryList from './pages/admin/InventoryList';
import CustomersList from './pages/admin/CustomersList';
import VendorsList from './pages/admin/VendorsList';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import SuppliersList from './pages/admin/SuppliersList';

// 📄 Componente placeholder para páginas en desarrollo
const PlaceholderPage = ({ title }) => (
  <div className="p-4 sm:p-6">
    <h1 className="font-display text-xl sm:text-2xl text-accent mb-4">{title}</h1>
    <div className="bg-dark-surface border border-dark-border rounded-xl p-6 sm:p-8 text-center">
      <p className="text-light-text/70 mb-4 text-sm sm:text-base">Módulo en desarrollo</p>
      <p className="text-light-text/50 text-xs sm:text-sm">Próximamente disponible</p>
    </div>
  </div>
);

// ✅ Wrapper para páginas públicas con MobileNav
const PublicLayout = ({ children }) => (
  <>
    <Header />
    <main className="pb-20 md:pb-0 min-h-screen">
      {children}
    </main>
    <Footer />
    <MobileNav />
  </>
);

// ✅ Wrapper para páginas de cliente con MobileNav
const ClientLayout = ({ children }) => (
  <RoleProtectedRoute requiredRoles={['CLIENTE', 'ADMIN', 'VENDEDOR']}>
    <Header />
    <main className="pb-20 md:pb-0 min-h-screen">
      {children}
    </main>
    <Footer />
    <MobileNav />
  </RoleProtectedRoute>
);

function App() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isCartOpen, setCartOpen } = useCartStore();

  useEffect(() => {
    // Verificar sesión al montar (Zustand persist ya restaura user/token)
  }, []);

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);
  
  const goToCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <Routes>
        {/* 🌐 RUTAS PÚBLICAS (con Header/Footer/MobileNav) */}
        <Route path="/" element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        } />
        
        <Route path="/login" element={
          <PublicLayout>
            <LoginForm />
          </PublicLayout>
        } />
        
        <Route path="/registro" element={
          <PublicLayout>
            <RegisterForm />
          </PublicLayout>
        } />
        
        <Route path="/catalogo" element={
          <PublicLayout>
            <Catalogo />
          </PublicLayout>
        } />
        
        <Route path="/checkout" element={
          <PublicLayout>
            <Checkout />
          </PublicLayout>
        } />
        
        <Route path="/checkout/rapido/:id" element={
          <PublicLayout>
            <QuickCheckout />
          </PublicLayout>
        } />

        <Route path="/checkout/confirmacion/:id" element={
          <PublicLayout>
            <CheckoutConfirmation />
          </PublicLayout>
        } />

        <Route path="/cotizador" element={
          <PublicLayout>
            <Cotizador />
          </PublicLayout>
        } />
        
        <Route path="/contacto" element={
          <PublicLayout>
            <Contacto />
          </PublicLayout>
        } />
        
        <Route path="/producto/:id" element={
          <PublicLayout>
            <ProductDetail />
          </PublicLayout>
        } />

        {/* 👤 RUTAS CLIENTE (con Header/Footer/MobileNav) */}
        <Route path="/perfil" element={
          <ClientLayout>
            <Perfil />
          </ClientLayout>
        } />

        {/* 👨‍💼 RUTAS VENDEDOR (SIN MobileNav - tiene su propio layout) */}
        <Route path="/vendedor/*" element={
          <RoleProtectedRoute requiredRoles={['VENDEDOR', 'ADMIN']}>
            <Header onOpenCart={openCart} />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<DashboardVendedor />} />
                <Route path="pedidos" element={<PlaceholderPage title="Gestión de Pedidos" />} />
                <Route path="pos" element={<PlaceholderPage title="POS Básico" />} />
              </Routes>
            </main>
            <Footer />
          </RoleProtectedRoute>
        } />

        {/* 👑 RUTAS ADMIN (CON AdminLayout - SIN Header/Footer/MobileNav) */}
        <Route path="/admin" element={
          <RoleProtectedRoute requiredRoles={['ADMIN']}>
            <AdminLayout />
          </RoleProtectedRoute>
        }>
          <Route index element={<DashboardAdmin />} />
          <Route path="productos" element={<ProductList />} />
          <Route path="productos/nuevo" element={<ProductForm />} />
          <Route path="productos/editar/:id" element={<ProductForm />} />
          <Route path="facturas" element={<InvoiceList />} />
          <Route path="pedidos" element={<OrdersList />} />
          <Route path="inventario" element={<InventoryList />} />
          <Route path="clientes" element={<CustomersList />} />
          <Route path="vendedores" element={<VendorsList />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
          <Route path="proveedores" element={<SuppliersList />} />
        </Route>

        {/* ❌ 404 Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ CartDrawer global (siempre disponible) */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default App;