// src/pages/vendedor/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';
import { 
  ShoppingCart, TrendingUp, Package, Users, Clock, 
  Search, Plus, Minus, Trash2, CheckCircle, Eye,
  FileText, DollarSign, Calendar, AlertTriangle, RefreshCw, X
} from 'lucide-react';

export default function DashboardVendedor() {
  const { user, token } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loadingData, setLoadingData] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 🛒 ESTADO DEL CARRITO POS
  const [cartItems, setCartItems] = useState([]);
  const [clientName, setClientName] = useState('');

  // 💳 ESTADOS DE PAGO
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [showYapeModal, setShowYapeModal] = useState(false);
  const [yapeReference, setYapeReference] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // 💾 ESTADOS DE DATOS REALES (API)
  const [realPendingOrders, setRealPendingOrders] = useState([]);
  const [realLowStockProducts, setRealLowStockProducts] = useState([]);
  const [realSalesHistory, setRealSalesHistory] = useState([]);
  const [realStats, setRealStats] = useState({
    ventasHoy: 0,
    pedidosHoy: 0,
    ticketPromedio: 0,
    clientesAtendidos: 0,
    pendientesCount: 0
  });

  // 📦 PRODUCTOS LOCALES PARA POS
  const localProducts = [
    { id: 'CEM001', nombre: 'Cemento Portland 42.5kg', precio: 28.50, stock: 240, categoria: 'Cemento' },
    { id: 'CEM002', nombre: 'Cemento Sol Tipo I 42.5kg', precio: 26.00, stock: 180, categoria: 'Cemento' },
    { id: 'CEM003', nombre: 'Cemento Andino 50kg', precio: 24.50, stock: 320, categoria: 'Cemento' },
    { id: 'FIE001', nombre: 'Varilla corrugada 1/2" x 9m', precio: 42.00, stock: 180, categoria: 'Fierro' },
    { id: 'FIE002', nombre: 'Varilla corrugada 3/8" x 9m', precio: 28.00, stock: 210, categoria: 'Fierro' },
    { id: 'FIE003', nombre: 'Malla electrosoldada 15x15', precio: 68.00, stock: 55, categoria: 'Fierro' },
    { id: 'FIE004', nombre: 'Alambre de amarre Nº16 (kg)', precio: 8.50, stock: 90, categoria: 'Fierro' },
    { id: 'LAD001', nombre: 'Ladrillo King Kong 18H', precio: 0.90, stock: 5000, categoria: 'Ladrillos' },
    { id: 'LAD002', nombre: 'Ladrillo Pandereta 8H', precio: 0.70, stock: 3000, categoria: 'Ladrillos' },
    { id: 'LAD003', nombre: 'Bloque de concreto 15x20x40', precio: 2.50, stock: 800, categoria: 'Ladrillos' },
    { id: 'AGR001', nombre: 'Arena gruesa (m3)', precio: 55.00, stock: 80, categoria: 'Agregados' },
    { id: 'AGR002', nombre: 'Piedra chancada 3/4" (m3)', precio: 70.00, stock: 60, categoria: 'Agregados' },
    { id: 'AGR003', nombre: 'Arena fina para tarrajeo (m3)', precio: 48.00, stock: 45, categoria: 'Agregados' },
    { id: 'PLO001', nombre: 'Tubería PVC 4" x 3m', precio: 18.50, stock: 95, categoria: 'Plomería' },
    { id: 'PLO002', nombre: 'Tubería PVC 1/2" x 5m', precio: 9.00, stock: 120, categoria: 'Plomería' },
    { id: 'PLO003', nombre: 'Codo PVC 4" 90 grados', precio: 3.20, stock: 200, categoria: 'Plomería' },
    { id: 'ELO001', nombre: 'Cable NYM 2.5mm2 100m', precio: 185.00, stock: 30, categoria: 'Electricidad' },
    { id: 'ELO002', nombre: 'Interruptor simple', precio: 12.00, stock: 75, categoria: 'Electricidad' },
    { id: 'ELO003', nombre: 'Tomacorriente doble', precio: 8.50, stock: 90, categoria: 'Electricidad' },
    { id: 'PIN001', nombre: 'Pintura latex blanco 20L', precio: 95.00, stock: 45, categoria: 'Pinturas' },
    { id: 'PIN002', nombre: 'Pintura esmalte azul 4L', precio: 45.00, stock: 35, categoria: 'Pinturas' },
    { id: 'HER001', nombre: 'Disco de corte 4.5"', precio: 3.80, stock: 150, categoria: 'Herramientas' },
    { id: 'HER002', nombre: 'Clavo 3 pulgadas (kg)', precio: 4.50, stock: 200, categoria: 'Herramientas' },
  ];

  const categories = ['Todos', 'Cemento', 'Fierro', 'Ladrillos', 'Agregados', 'Plomería', 'Electricidad', 'Pinturas', 'Herramientas'];

  // Actualizar reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ ACTUALIZACIÓN AUTOMÁTICA cada 10 segundos
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, [token]);

  // ✅ FUNCIÓN MEJORADA: Carga de datos reales
  const fetchData = async () => {
    if (!token) {
      console.warn('⚠️ No hay token, no se pueden cargar datos');
      return;
    }
    
    setLoadingData(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Obtener TODOS los pedidos
      const ordersRes = await axios.get('http://localhost:4000/api/orders', { 
        headers,
        params: { page: 1, limit: 500 }
      });
      
      const allOrders = ordersRes.data?.data || [];
      console.log('📦 Total de pedidos obtenidos:', allOrders.length);
      
      // 2. Filtrar pedidos pendientes
      const pending = allOrders.filter(o => 
        o.estado === 'NUEVO' || o.estado === 'EN_PREPARACION'
      );
      setRealPendingOrders(pending);

      // 3. Calcular Estadísticas del DÍA
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      // Filtrar pedidos de HOY
      const ordersToday = allOrders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        return orderDate >= hoy && orderDate < manana;
      });

      console.log('📅 Pedidos de hoy:', ordersToday.length);

      // Ventas de hoy: pedidos confirmados
      const ventasConfirmadas = ordersToday.filter(o => 
        o.estado === 'ENTREGADO' || 
        o.estado === 'EN_CAMINO' || 
        o.estado === 'EN_PREPARACION' ||
        o.estado === 'NUEVO'
      );

      const totalVentas = ventasConfirmadas.reduce((sum, o) => {
        return sum + (parseFloat(o.total) || 0);
      }, 0);

      const countVentas = ventasConfirmadas.length;

      // Clientes únicos atendidos hoy
      const clientesUnicosSet = new Set();
      ordersToday.forEach(o => {
        if (o.clienteId) {
          clientesUnicosSet.add(o.clienteId);
        } else if (o.cliente?.id) {
          clientesUnicosSet.add(o.cliente.id);
        }
      });

      const stats = {
        ventasHoy: totalVentas,
        pedidosHoy: ordersToday.length,
        ticketPromedio: countVentas > 0 ? totalVentas / countVentas : 0,
        clientesAtendidos: clientesUnicosSet.size,
        pendientesCount: pending.length
      };

      console.log('📊 Estadísticas actualizadas:', stats);
      setRealStats(stats);

      // 4. Obtener Productos con Stock Bajo
      try {
        const productsRes = await axios.get('http://localhost:4000/api/products', { 
          headers,
          params: { limit: 500 }
        });
        const products = productsRes.data?.data || [];
        const lowStock = products.filter(p => p.stock < 50);
        setRealLowStockProducts(lowStock);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setRealLowStockProducts([]);
      }

      // 5. Historial de Ventas (Pedidos completados hoy)
      const completedOrders = ordersToday.filter(o => 
        o.estado === 'ENTREGADO' || o.estado === 'EN_CAMINO'
      );
      setRealSalesHistory(completedOrders);

      // Actualizar timestamp
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('❌ Error cargando datos del vendedor:', err);
      console.error('Detalles:', err.response?.data || err.message);
      
      setRealPendingOrders([]);
      setRealLowStockProducts([]);
      setRealSalesHistory([]);
      setRealStats({
        ventasHoy: 0,
        pedidosHoy: 0,
        ticketPromedio: 0,
        clientesAtendidos: 0,
        pendientesCount: 0
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    fetchData();
  }, []);

  // ✅ ACCIÓN: Preparar Pedido
  const handlePrepareOrder = async (orderId) => {
    if (!confirm('¿Confirmar que este pedido ha sido preparado y enviado?')) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`http://localhost:4000/api/orders/${orderId}/status`, 
        { estado: 'EN_CAMINO' }, 
        { headers }
      );
      
      setRealPendingOrders(prev => prev.filter(o => o.id !== orderId));
      setRealStats(prev => ({ ...prev, pendientesCount: prev.pendientesCount - 1 }));
      
      alert('✅ Pedido actualizado a "En Camino"');
      fetchData();
    } catch (err) {
      alert('Error al actualizar el pedido: ' + (err.response?.data?.error || err.message));
    }
  };

  // 🔍 FILTRADO DE PRODUCTOS LOCALES
  const filteredProducts = useMemo(() => {
    return localProducts.filter(product => {
      const matchCategory = selectedCategory === 'Todos' || product.categoria === selectedCategory;
      const matchSearch = 
        product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // 🛒 FUNCIONES DEL CARRITO POS
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, cantidad: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, cantidad: newQuantity } : item
      )
    );
  };

  // 💰 CÁLCULOS DEL CARRITO
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const cartIGV = cartSubtotal * 0.18;
  const cartTotal = cartSubtotal + cartIGV;

  // ✅ PROCESAR PAGO
  const processPayment = async () => {
    if (cartItems.length === 0) {
      alert('Agrega productos al carrito');
      return;
    }

    if (paymentMethod === 'yape' && !yapeReference.trim()) {
      alert('Ingresa el número de operación de Yape');
      return;
    }

    setProcessingPayment(true);

    try {
      const tokenAuth = localStorage.getItem('token');
      
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.id,
          cantidad: item.cantidad,
          precioUnitario: item.precio
        })),
        direccionEntrega: 'Venta en Tienda - Recoger en local',
        lat: -15.5045,
        lng: -70.1359,
        costoDelivery: 0,
        notas: clientName ? `Cliente: ${clientName} | Método: ${paymentMethod.toUpperCase()}${yapeReference ? ` | Ref: ${yapeReference}` : ''}` : `Venta mostrador | Método: ${paymentMethod.toUpperCase()}${yapeReference ? ` | Ref: ${yapeReference}` : ''}`,
        metodoPago: paymentMethod.toUpperCase(),
        ...(paymentMethod === 'yape' && { yapeReference })
      };

      const response = await axios.post('http://localhost:4000/api/orders', orderData, {
        headers: {
          Authorization: `Bearer ${tokenAuth}`,
          'Content-Type': 'application/json'
        }
      });

      alert(`✅ Venta procesada correctamente\n\nPedido: ${response.data.data.pedidoId}\nTotal: S/ ${cartTotal.toFixed(2)}\nMétodo: ${paymentMethod.toUpperCase()}`);
      
      setCartItems([]);
      setClientName('');
      setYapeReference('');
      setShowYapeModal(false);
      setPaymentMethod('efectivo');
      
      fetchData();
      
    } catch (err) {
      console.error('Error procesando pago:', err);
      alert('Error al procesar el pago: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Agrega productos al carrito');
      return;
    }

    if (paymentMethod === 'efectivo') {
      processPayment();
    } else if (paymentMethod === 'yape') {
      setShowYapeModal(true);
    } else if (paymentMethod === 'tarjeta') {
      alert('💳 Pago con tarjeta próximamente disponible');
    }
  };

  const openYapeModal = () => {
    if (cartItems.length === 0) {
      alert('Agrega productos al carrito primero');
      return;
    }
    setPaymentMethod('yape');
    setShowYapeModal(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      
      {/* HEADER DEL VENDEDOR */}
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-30">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-dark-bg font-bold text-sm">F</span>
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold text-light-text">FERREALTIPLANO</h1>
                  <p className="text-xs text-light-text/50">Panel Vendedor</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
                <span className="text-xs text-accent font-medium">Turno en curso</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-lg border border-dark-border">
                <Clock size={14} className="text-accent" />
                <span className="text-sm font-mono font-bold text-light-text">
                  {currentTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent text-xs font-bold">
                    {user?.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'VE'}
                  </span>
                </div>
                <span className="text-sm text-light-text hidden md:block">{user?.nombre || 'Vendedor'}</span>
              </div>
            </div>
          </div>

          {/* Tabs de Navegación */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {[
              { id: 'pos', label: 'Venta en Tienda', icon: ShoppingCart },
              { id: 'pedidos', label: 'Pedidos Pendientes', icon: FileText, badge: realStats.pendientesCount },
              { id: 'stock', label: 'Consultar Stock', icon: Package },
              { id: 'historial', label: 'Historial Turno', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-accent text-dark-bg'
                    : 'bg-dark-bg text-light-text/70 hover:text-light-text hover:bg-dark-bg/80'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="p-6">
        
        {/* TAB: POS - Venta en Tienda */}
        {activeTab === 'pos' && (
          <div className="space-y-6">
            
            {/* Métricas del Turno (API) - ACTUALIZADAS EN TIEMPO REAL */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="text-green-400" size={20} />
                  <span className="text-xs text-light-text/50">Ventas Hoy</span>
                </div>
                <p className="text-2xl font-display font-bold text-green-400">
                  S/ {realStats.ventasHoy.toFixed(2)}
                </p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={14} className="animate-spin text-accent" /></div>}
                <p className="text-xs text-light-text/40 mt-1">
                  Actualizado: {lastUpdate.toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </p>
              </div>
              
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="text-blue-400" size={20} />
                  <span className="text-xs text-light-text/50">Pedidos Hoy</span>
                </div>
                <p className="text-2xl font-display font-bold text-blue-400">{realStats.pedidosHoy}</p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={14} className="animate-spin text-accent" /></div>}
              </div>
              
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="text-purple-400" size={20} />
                  <span className="text-xs text-light-text/50">Ticket Promedio</span>
                </div>
                <p className="text-2xl font-display font-bold text-purple-400">
                  S/ {realStats.ticketPromedio.toFixed(2)}
                </p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={14} className="animate-spin text-accent" /></div>}
              </div>
              
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <Users className="text-accent" size={20} />
                  <span className="text-xs text-light-text/50">Clientes Atendidos</span>
                </div>
                <p className="text-2xl font-display font-bold text-accent">{realStats.clientesAtendidos}</p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={14} className="animate-spin text-accent" /></div>}
              </div>
            </div>

            {/* Botón de Actualización Manual */}
            <div className="flex justify-end">
              <button 
                onClick={fetchData}
                disabled={loadingData}
                className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-light-text hover:border-accent hover:text-accent transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
                Actualizar Datos
              </button>
            </div>

            {/* Área POS Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Catálogo de Productos */}
              <div className="lg:col-span-2 space-y-4">
                
                <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
                      <input 
                        type="text" 
                        placeholder="Buscar producto o código..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-light-text focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                          selectedCategory === cat
                            ? 'bg-accent text-dark-bg'
                            : 'bg-dark-bg border border-dark-border text-light-text/70 hover:border-accent hover:text-accent'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-light-text/50">
                      <Search size={48} className="mx-auto mb-2 opacity-30" />
                      <p>No se encontraron productos</p>
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-dark-surface border border-dark-border rounded-xl p-4 hover:border-accent hover:bg-dark-bg/50 transition text-left group active:scale-95"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-light-text/40 font-mono">{product.id}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            product.stock < 20 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {product.stock}
                          </span>
                        </div>
                        <p className="text-sm text-light-text font-medium mb-3 line-clamp-2 group-hover:text-accent transition">
                          {product.nombre}
                        </p>
                        <p className="text-lg font-display font-bold text-accent">
                          S/ {product.precio.toFixed(2)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Carrito de Venta */}
              <div className="bg-dark-surface border border-dark-border rounded-xl p-6 sticky top-40 h-fit">
                <h3 className="font-display text-lg font-bold text-light-text mb-4">Venta en Tienda</h3>
                
                <div className="mb-4">
                  <input 
                    type="text" 
                    placeholder="Nombre del cliente (opcional)" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="bg-dark-bg rounded-lg border border-dark-border p-4 mb-4 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3">
                  {cartItems.length === 0 ? (
                    <p className="text-light-text/50 text-sm text-center py-8">
                      Haz clic en un producto para agregar
                    </p>
                  ) : (
                    cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-dark-surface rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-light-text font-medium truncate">{item.nombre}</p>
                          <p className="text-xs text-accent">S/ {item.precio.toFixed(2)} c/u</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                            className="p-1 bg-dark-bg rounded hover:bg-accent/20 text-light-text hover:text-accent transition"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold text-light-text w-6 text-center">{item.cantidad}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                            className="p-1 bg-dark-bg rounded hover:bg-accent/20 text-light-text hover:text-accent transition"
                          >
                            <Plus size={14} />
                          </button>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm text-light-text/70">
                    <span>Subtotal</span>
                    <span>S/ {cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-light-text/70">
                    <span>IGV (18%)</span>
                    <span>S/ {cartIGV.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-display font-bold text-accent pt-3 border-t border-dark-border">
                    <span>Total</span>
                    <span>S/ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-sm text-light-text font-medium">Método de Pago:</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        paymentMethod === 'efectivo'
                          ? 'bg-accent text-dark-bg'
                          : 'bg-dark-bg border border-dark-border text-light-text/70 hover:border-accent'
                      }`}
                    >
                      💵 Efectivo
                    </button>
                    <button 
                      onClick={openYapeModal}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        paymentMethod === 'yape'
                          ? 'bg-purple-600 text-white'
                          : 'bg-dark-bg border border-dark-border text-light-text/70 hover:border-purple-500'
                      }`}
                    >
                      📱 Yape
                    </button>
                    <button 
                      onClick={() => {
                        setPaymentMethod('tarjeta');
                        alert('💳 Pago con tarjeta próximamente disponible');
                      }}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        paymentMethod === 'tarjeta'
                          ? 'bg-blue-600 text-white'
                          : 'bg-dark-bg border border-dark-border text-light-text/70 hover:border-blue-500'
                      }`}
                    >
                      💳 Tarjeta
                    </button>
                  </div>

                  {paymentMethod === 'efectivo' && (
                    <p className="text-xs text-light-text/50">
                      💵 El cliente pagará en efectivo al recoger
                    </p>
                  )}
                  {paymentMethod === 'yape' && (
                    <p className="text-xs text-purple-400">
                      📱 Escanea el QR y registra el número de operación
                    </p>
                  )}
                  {paymentMethod === 'tarjeta' && (
                    <p className="text-xs text-blue-400">
                      💳 Pago con tarjeta (Próximamente)
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || processingPayment}
                  className="w-full bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? 'Procesando...' : `Cobrar S/ ${cartTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Pedidos Pendientes (API REAL) */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl text-light-text">Pedidos Pendientes de Preparación</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm">{realPendingOrders.length} pedidos</span>
                <button onClick={fetchData} className="p-2 hover:bg-dark-bg rounded-lg transition" title="Actualizar">
                  <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-20 text-accent">Cargando pedidos...</div>
            ) : realPendingOrders.length === 0 ? (
              <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                <p className="text-light-text/70">No hay pedidos pendientes</p>
                <p className="text-light-text/50 text-sm mt-1">¡Excelente trabajo! Estás al día</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {realPendingOrders.map(order => (
                  <div key={order.id} className="bg-dark-surface border border-dark-border rounded-xl p-6 hover:border-accent/50 transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-display font-bold text-light-text">{order.id?.slice(-8) || 'N/A'}</h3>
                        <p className="text-sm text-light-text/70">{order.cliente?.nombre || 'Cliente General'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.estado === 'NUEVO' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.estado?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4 text-sm text-light-text/60">
                        <span className="flex items-center gap-1">
                          <Package size={14} /> {order.items?.length || 0} items
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                        </span>
                      </div>
                      <span className="font-display font-bold text-accent">S/ {(order.total || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrepareOrder(order.id)}
                        className="flex-1 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-2 rounded-lg text-sm transition"
                      >
                        {order.estado === 'NUEVO' ? 'Preparar Pedido' : 'Marcar Enviado'}
                      </button>
                      <button className="p-2 bg-dark-bg border border-dark-border rounded-lg text-light-text/70 hover:text-accent transition">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Consultar Stock (API REAL) */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl text-light-text">Consulta de Stock en Tiempo Real</h2>
              <button onClick={fetchData} className="p-2 hover:bg-dark-bg rounded-lg transition" title="Actualizar">
                <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {loadingData ? (
              <div className="text-center py-20 text-accent">Cargando inventario...</div>
            ) : (
              <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-bg border-b border-dark-border">
                    <tr>
                      <th className="text-left p-4 text-light-text/70 text-sm">Producto</th>
                      <th className="text-left p-4 text-light-text/70 text-sm">Código</th>
                      <th className="text-left p-4 text-light-text/70 text-sm">Stock Actual</th>
                      <th className="text-left p-4 text-light-text/70 text-sm">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {realLowStockProducts.length === 0 ? (
                      <tr><td colSpan="4" className="p-8 text-center text-light-text/50">✅ No hay productos con stock bajo</td></tr>
                    ) : (
                      realLowStockProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-dark-bg/50 transition">
                          <td className="p-4 text-light-text">{product.nombre}</td>
                          <td className="p-4 text-light-text/50 font-mono text-sm">{product.id}</td>
                          <td className="p-4 font-bold text-light-text">{product.stock}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              product.stock < 10 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              <AlertTriangle size={12} />
                              {product.stock < 10 ? 'Crítico' : 'Bajo'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: Historial del Turno (API REAL) */}
        {activeTab === 'historial' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl text-light-text">Historial de Ventas del Turno</h2>
              <span className="text-light-text/50 text-sm">Fecha: {new Date().toLocaleDateString('es-PE')}</span>
            </div>

            {loadingData ? (
              <div className="text-center py-20 text-accent">Cargando historial...</div>
            ) : (
              <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-bg border-b border-dark-border">
                    <tr>
                      <th className="text-left p-4 text-light-text/70 text-sm">ID Venta</th>
                      <th className="text-left p-4 text-light-text/70 text-sm">Cliente</th>
                      <th className="text-left p-4 text-light-text/70 text-sm">Hora</th>
                      <th className="text-left p-4 text-light-text/70 text-sm">Método</th>
                      <th className="text-right p-4 text-light-text/70 text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {realSalesHistory.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-light-text/50">No hay ventas registradas hoy</td></tr>
                    ) : (
                      realSalesHistory.map(sale => (
                        <tr key={sale.id} className="hover:bg-dark-bg/50 transition">
                          <td className="p-4 font-mono text-accent text-sm">{sale.id?.slice(-8) || 'N/A'}</td>
                          <td className="p-4 text-light-text">{sale.cliente?.nombre || 'General'}</td>
                          <td className="p-4 text-light-text/50 text-sm">
                            {sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-light-text/70">
                              {sale.metodoPago || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4 text-right font-display font-bold text-light-text">
                            S/ {(sale.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
                <p className="text-light-text/60 text-sm mb-1">Total Vendido</p>
                <p className="text-3xl font-display font-bold text-green-400">S/ {realStats.ventasHoy.toFixed(2)}</p>
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
                <p className="text-light-text/60 text-sm mb-1">Transacciones</p>
                <p className="text-3xl font-display font-bold text-blue-400">{realStats.pedidosHoy}</p>
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
                <p className="text-light-text/60 text-sm mb-1">Promedio por Venta</p>
                <p className="text-3xl font-display font-bold text-purple-400">S/ {realStats.ticketPromedio.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE PAGO YAPE */}
      {showYapeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl max-w-md w-full p-6 animate-fadeIn">
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-light-text">Pagar con Yape</h3>
                  <p className="text-sm text-light-text/60">Escanea y registra el pago</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowYapeModal(false);
                  setYapeReference('');
                }}
                className="p-2 text-light-text/60 hover:text-light-text transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6">
              <div className="aspect-square bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-6xl mb-2">📱</div>
                  <p className="text-purple-900 font-bold">QR de Yape</p>
                  <p className="text-purple-700 text-sm">999888777</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-700 mb-1">Total a pagar:</p>
                <p className="text-3xl font-bold text-purple-600">S/ {cartTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Número Yape: <span className="font-bold">999888777</span>
                </p>
                <p className="text-xs text-gray-500">
                  A nombre de: <span className="font-bold">FERREALTIPLANO</span>
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-light-text/70 mb-2">
                Número de Operación Yape *
              </label>
              <input
                type="text"
                value={yapeReference}
                onChange={(e) => setYapeReference(e.target.value)}
                placeholder="Ej: 123456 o DNI del cliente"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-light-text/50 mt-1">
                Ingresa el código de operación o el DNI del titular
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowYapeModal(false);
                  setYapeReference('');
                }}
                className="flex-1 py-3 bg-dark-bg border border-dark-border text-light-text rounded-lg font-medium hover:border-accent transition"
              >
                Cancelar
              </button>
              <button
                onClick={processPayment}
                disabled={!yapeReference.trim() || processingPayment}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingPayment ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-purple-300">
                💡 <strong>Instrucciones:</strong><br/>
                1. El cliente escanea el QR con su app Yape<br/>
                2. Ingresa el monto: S/ {cartTotal.toFixed(2)}<br/>
                3. Confirma el pago<br/>
                4. Registra el número de operación arriba
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}