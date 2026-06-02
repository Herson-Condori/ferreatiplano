// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// 🎨 Layouts Principales
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';

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
  <div className="p-6">
    <h1 className="font-display text-2xl text-accent mb-4">{title}</h1>
    <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
      <p className="text-light-text/70 mb-4">Módulo en desarrollo</p>
      <p className="text-light-text/50 text-sm">Próximamente disponible</p>
    </div>
  </div>
);

function App() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    // Verificar sesión al montar (Zustand persist ya restaura user/token)
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  
  const goToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <Routes>
      {/* 🌐 RUTAS PÚBLICAS (con Header/Footer) */}
      <Route path="/" element={
        <>
          <Header onOpenCart={openCart} />
          <Home />
          <Footer />
        </>
      } />
      
      <Route path="/login" element={
        <>
          <Header onOpenCart={openCart} />
          <LoginForm />
          <Footer />
        </>
      } />
      
      <Route path="/registro" element={
        <>
          <Header onOpenCart={openCart} />
          <RegisterForm />
          <Footer />
        </>
      } />
      
      <Route path="/catalogo" element={
        <>
          <Header onOpenCart={openCart} />
          <Catalogo />
          <Footer />
        </>
      } />
      
      <Route path="/checkout" element={
        <>
          <Header onOpenCart={openCart} />
          <Checkout />
          <Footer />
        </>
      } />
      
      <Route path="/checkout/rapido/:id" element={
        <>
         <Header onOpenCart={openCart} />
         <QuickCheckout />
         <Footer />
        </>
      } />

      <Route path="/checkout/confirmacion/:id" element={
       <>
        <Header onOpenCart={openCart} />
        <CheckoutConfirmation />
        <Footer />
       </>
      } />

      <Route path="/cotizador" element={
        <>
          <Header onOpenCart={openCart} />
          <Cotizador />
          <Footer />
        </>
      } />
      
      <Route path="/contacto" element={
        <>
          <Header onOpenCart={openCart} />
          <Contacto />
          <Footer />
        </>
      } />
      
      <Route path="/producto/:id" element={
        <>
          <Header onOpenCart={openCart} />
          <ProductDetail />
          <Footer />
        </>
      } />

      {/* 👤 RUTAS CLIENTE (con Header/Footer) */}
      <Route path="/perfil" element={
        <RoleProtectedRoute requiredRoles={['CLIENTE', 'ADMIN', 'VENDEDOR']}>
          <>
            <Header onOpenCart={openCart} />
            <Perfil />
            <Footer />
          </>
        </RoleProtectedRoute>
      } />

      {/* 👨‍💼 RUTAS VENDEDOR (con Header/Footer) */}
      <Route path="/vendedor/*" element={
        <RoleProtectedRoute requiredRoles={['VENDEDOR', 'ADMIN']}>
          <>
            <Header onOpenCart={openCart} />
            <Routes>
              <Route path="/" element={<DashboardVendedor />} />
              <Route path="pedidos" element={<PlaceholderPage title="Gestión de Pedidos" />} />
              <Route path="pos" element={<PlaceholderPage title="POS Básico" />} />
            </Routes>
            <Footer />
          </>
        </RoleProtectedRoute>
      } />

      {/* 👑 RUTAS ADMIN (CON AdminLayout - SIN Header/Footer) */}
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
  );
}

export default App;