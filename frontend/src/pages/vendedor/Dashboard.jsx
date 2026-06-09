// src/pages/vendedor/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';
import { 
  ShoppingCart, TrendingUp, Package, Users, Clock, 
  Search, Plus, Minus, Trash2, CheckCircle, Eye,
  FileText, DollarSign, Calendar, AlertTriangle, RefreshCw, X, Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function DashboardVendedor() {
  const { user, token } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 📝 GENERAR TICKET DE VENTA (FORMATO TÉRMICO 80mm)
  const generateTicketPDF = (order) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160 + ((order.items?.length || 0) * 10)]
    });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("FERREALTIPLANO", 40, 10, { align: "center" });
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Av. Ilave 1234, Juliaca", 40, 14, { align: "center" });
    doc.text("RUC: 20601234567", 40, 18, { align: "center" });
    doc.text("Teléf: +51 942 318 219", 40, 22, { align: "center" });
    
    doc.line(5, 25, 75, 25);
    
    // Info del Pedido
    doc.setFont("Helvetica", "bold");
    doc.text(`TICKET DE VENTA: ${order.id?.slice(-8).toUpperCase()}`, 5, 30);
    doc.setFont("Helvetica", "normal");
    doc.text(`Fecha: ${new Date(order.createdAt || new Date()).toLocaleString('es-PE')}`, 5, 34);
    
    // Obtener nombre del cliente
    let clientLabel = "Público General";
    if (order.cliente?.nombre) {
      clientLabel = order.cliente.nombre;
    } else if (order.notas && order.notas.includes("Cliente: ")) {
      const parts = order.notas.split("|");
      const clientPart = parts.find(p => p.includes("Cliente: "));
      if (clientPart) {
        clientLabel = clientPart.replace("Cliente: ", "").trim();
      }
    }
    doc.text(`Cliente: ${clientLabel}`, 5, 38);
    doc.text(`Método Pago: ${order.metodoPago || 'EFECTIVO'}`, 5, 42);
    
    doc.line(5, 45, 75, 45);
    
    // Cabecera de Items
    doc.setFont("Helvetica", "bold");
    doc.text("Cant  Descripción", 5, 49);
    doc.text("Total", 75, 49, { align: "right" });
    doc.setFont("Helvetica", "normal");
    
    let y = 54;
    const itemsList = order.items || [];
    itemsList.forEach((item) => {
      const cant = item.cantidad || 1;
      const desc = item.producto?.nombre || item.nombre || "Producto";
      const price = Number(item.precioUnitario || item.precio || 0);
      const totalItem = cant * price;
      
      doc.text(`${cant}`, 5, y);
      
      // Truncar descripción si es muy larga
      const cleanDesc = desc.length > 25 ? desc.substring(0, 25) + "..." : desc;
      doc.text(cleanDesc, 12, y);
      doc.text(`S/ ${totalItem.toFixed(2)}`, 75, y, { align: "right" });
      
      // Mostrar precio unitario abajo
      doc.setFontSize(7);
      doc.text(`  (${cant} x S/ ${price.toFixed(2)})`, 12, y + 3);
      doc.setFontSize(8);
      
      y += 8;
    });
    
    doc.line(5, y, 75, y);
    y += 5;
    
    // Totales
    const totalVal = Number(order.total || 0);
    const subtotalVal = totalVal / 1.18;
    const igvVal = totalVal - subtotalVal;
    
    doc.text("Subtotal:", 45, y);
    doc.text(`S/ ${subtotalVal.toFixed(2)}`, 75, y, { align: "right" });
    
    doc.text("IGV (18%):", 45, y + 4);
    doc.text(`S/ ${igvVal.toFixed(2)}`, 75, y + 4, { align: "right" });
    
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAL:", 45, y + 9);
    doc.text(`S/ ${totalVal.toFixed(2)}`, 75, y + 9, { align: "right" });
    
    y += 16;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text("¡Gracias por su compra!", 40, y, { align: "center" });
    doc.text("FERREALTIPLANO - Juliaca", 40, y + 4, { align: "center" });

    // Guardar PDF
    doc.save(`ticket-${order.id?.slice(-8) || 'venta'}.pdf`);
  };
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
  const [dbProducts, setDbProducts] = useState([]);
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
    }, 10000);
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

      const ordersRes = await axios.get('http://localhost:4000/api/orders', { 
        headers,
        params: { page: 1, limit: 500 }
      });
      
      const allOrders = ordersRes.data?.data || [];
      console.log('📦 Total de pedidos obtenidos:', allOrders.length);
      
      const pending = allOrders.filter(o => 
        o.estado === 'NUEVO' || o.estado === 'EN_PREPARACION'
      );
      setRealPendingOrders(pending);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      const ordersToday = allOrders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        return orderDate >= hoy && orderDate < manana;
      });

      console.log('📅 Pedidos de hoy:', ordersToday.length);

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

      try {
        const productsRes = await axios.get('http://localhost:4000/api/products', { 
          headers,
          params: { limit: 500 }
        });
        const products = (productsRes.data?.data || []).map(p => ({
          ...p,
          precio: Number(p.precio) || 0
        }));
        setDbProducts(products);
        const lowStock = products.filter(p => p.stock < 50);
        setRealLowStockProducts(lowStock);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setRealLowStockProducts([]);
      }

      const completedOrders = ordersToday.filter(o => 
        o.estado === 'ENTREGADO' || o.estado === 'EN_CAMINO'
      );
      setRealSalesHistory(completedOrders);

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

  useEffect(() => {
    fetchData();
  }, []);

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

  const filteredProducts = useMemo(() => {
    const productsToUse = dbProducts.length > 0 ? dbProducts : [];
    return productsToUse.filter(product => {
      const matchCategory = selectedCategory === 'Todos' || product.categoria?.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = 
        product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [dbProducts, selectedCategory, searchQuery]);

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

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const cartIGV = cartSubtotal * 0.18;
  const cartTotal = cartSubtotal + cartIGV;

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
      
      // 📝 DESCARGAR TICKET DE VENTA AUTOMÁTICAMENTE
      try {
        const completedOrder = {
          id: response.data.data.pedidoId,
          cliente: { nombre: clientName },
          items: cartItems.map(item => ({
            cantidad: item.cantidad,
            nombre: item.nombre,
            precioUnitario: item.precio
          })),
          total: cartTotal,
          metodoPago: paymentMethod.toUpperCase(),
          createdAt: new Date()
        };
        generateTicketPDF(completedOrder);
      } catch (pdfErr) {
        console.error('Error al generar PDF de ticket:', pdfErr);
      }

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
      
      {/* HEADER DEL VENDEDOR - RESPONSIVE */}
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-30">
        <div className="px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-dark-bg font-bold text-xs sm:text-sm">F</span>
                </div>
                <div>
                  <h1 className="font-display text-sm sm:text-lg font-bold text-light-text">FERREALTIPLANO</h1>
                  <p className="text-[10px] sm:text-xs text-light-text/50">Panel Vendedor</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
                <span className="text-xs text-accent font-medium">Turno en curso</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-dark-bg rounded-lg border border-dark-border">
                <Clock size={12} className="text-accent sm:hidden" />
                <Clock size={14} className="text-accent hidden sm:block" />
                <span className="text-xs sm:text-sm font-mono font-bold text-light-text">
                  {currentTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent text-xs font-bold">
                    {user?.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'VE'}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-light-text hidden md:block">{user?.nombre || 'Vendedor'}</span>
              </div>
            </div>
          </div>

          {/* Tabs de Navegación - Scroll horizontal en móvil */}
          <div className="flex gap-1 mt-2 sm:mt-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            {[
              { id: 'pos', label: 'Venta', icon: ShoppingCart },
              { id: 'pedidos', label: 'Pedidos', icon: FileText, badge: realStats.pendientesCount },
              { id: 'stock', label: 'Stock', icon: Package },
              { id: 'historial', label: 'Historial', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-accent text-dark-bg'
                    : 'bg-dark-bg text-light-text/70 hover:text-light-text hover:bg-dark-bg/80'
                }`}
              >
                <tab.icon size={14} className="sm:hidden" />
                <tab.icon size={16} className="hidden sm:block" />
                <span>{tab.label}</span>
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

      {/* CONTENIDO PRINCIPAL - RESPONSIVE */}
      <main className="p-3 sm:p-6">
        
        {/* TAB: POS - Venta en Tienda */}
        {activeTab === 'pos' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Métricas del Turno - Grid 2x2 en móvil */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-dark-surface border border-dark-border rounded-xl p-2.5 sm:p-4 relative">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <DollarSign className="text-green-400" size={16} />
                  <span className="text-[10px] sm:text-xs text-light-text/50">Ventas Hoy</span>
                </div>
                <p className="text-sm sm:text-2xl font-display font-bold text-green-400 truncate">
                  S/ {realStats.ventasHoy.toFixed(2)}
                </p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={12} className="animate-spin text-accent" /></div>}
                <p className="text-[9px] sm:text-xs text-light-text/40 mt-1 hidden sm:block">
                  Actualizado: {lastUpdate.toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </p>
              </div>
              
              <div className="bg-dark-surface border border-dark-border rounded-xl p-2.5 sm:p-4 relative">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <ShoppingCart className="text-blue-400" size={16} />
                  <span className="text-[10px] sm:text-xs text-light-text/50">Pedidos Hoy</span>
                </div>
                <p className="text-sm sm:text-2xl font-display font-bold text-blue-400">{realStats.pedidosHoy}</p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={12} className="animate-spin text-accent" /></div>}
              </div>
              
              <div className="bg-dark-surface border border-dark-border rounded-xl p-2.5 sm:p-4 relative">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <TrendingUp className="text-purple-400" size={16} />
                  <span className="text-[10px] sm:text-xs text-light-text/50">Ticket Promedio</span>
                </div>
                <p className="text-sm sm:text-2xl font-display font-bold text-purple-400 truncate">
                  S/ {realStats.ticketPromedio.toFixed(2)}
                </p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={12} className="animate-spin text-accent" /></div>}
              </div>
              
              <div className="bg-dark-surface border border-dark-border rounded-xl p-2.5 sm:p-4 relative">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <Users className="text-accent" size={16} />
                  <span className="text-[10px] sm:text-xs text-light-text/50">Clientes</span>
                </div>
                <p className="text-sm sm:text-2xl font-display font-bold text-accent">{realStats.clientesAtendidos}</p>
                {loadingData && <div className="absolute top-2 right-2"><RefreshCw size={12} className="animate-spin text-accent" /></div>}
              </div>
            </div>

            {/* Botón de Actualización Manual */}
            <div className="flex justify-end">
              <button 
                onClick={fetchData}
                disabled={loadingData}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-light-text hover:border-accent hover:text-accent transition disabled:opacity-50 text-xs sm:text-sm"
              >
                <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Actualizar Datos</span>
                <span className="sm:hidden">Actualizar</span>
              </button>
            </div>

            {/* Área POS Principal - Stack vertical en móvil */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Catálogo de Productos */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                
                <div className="bg-dark-surface border border-dark-border rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" />
                      <input 
                        type="text" 
                        placeholder="Buscar producto o código..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-light-text focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  
                  {/* Categorías con scroll horizontal en móvil */}
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
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

                {/* Grid de productos: 2 cols móvil, 3 tablet, 4 desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-light-text/50">
                      <Search size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No se encontraron productos</p>
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl p-2.5 sm:p-4 hover:border-accent hover:bg-dark-bg/50 transition text-left group active:scale-95"
                      >
                        <div className="flex justify-between items-start mb-1 sm:mb-2 font-mono text-[10px] sm:text-xs">
                          <span className="text-light-text/40">#{product.id.substring(0, 8).toUpperCase()}</span>
                          <span className={`px-1 sm:px-1.5 py-0.5 rounded ${
                            product.stock < 20 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {product.stock}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-light-text font-medium mb-2 sm:mb-3 line-clamp-2 group-hover:text-accent transition">
                          {product.nombre}
                        </p>
                        <p className="text-sm sm:text-lg font-display font-bold text-accent">
                          S/ {product.precio.toFixed(2)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Carrito de Venta - Debajo del catálogo en móvil */}
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6 lg:sticky lg:top-24 h-fit">
                <h3 className="font-display text-base sm:text-lg font-bold text-light-text mb-3 sm:mb-4">Venta en Tienda</h3>
                
                <div className="mb-3 sm:mb-4">
                  <input 
                    type="text" 
                    placeholder="Nombre del cliente (opcional)" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="bg-dark-bg rounded-lg border border-dark-border p-3 sm:p-4 mb-3 sm:mb-4 min-h-[150px] sm:min-h-[200px] max-h-[250px] sm:max-h-[300px] overflow-y-auto space-y-2 sm:space-y-3">
                  {cartItems.length === 0 ? (
                    <p className="text-light-text/50 text-xs sm:text-sm text-center py-6 sm:py-8">
                      Haz clic en un producto para agregar
                    </p>
                  ) : (
                    cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-dark-surface rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-light-text font-medium truncate">{item.nombre}</p>
                          <p className="text-xs text-accent">S/ {item.precio.toFixed(2)} c/u</p>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                            className="p-1 bg-dark-bg rounded hover:bg-accent/20 text-light-text hover:text-accent transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs sm:text-sm font-bold text-light-text w-5 sm:w-6 text-center">{item.cantidad}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                            className="p-1 bg-dark-bg rounded hover:bg-accent/20 text-light-text hover:text-accent transition"
                          >
                            <Plus size={12} />
                          </button>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                  <div className="flex justify-between text-xs sm:text-sm text-light-text/70">
                    <span>Subtotal</span>
                    <span>S/ {cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-light-text/70">
                    <span>IGV (18%)</span>
                    <span>S/ {cartIGV.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-xl font-display font-bold text-accent pt-2 sm:pt-3 border-t border-dark-border">
                    <span>Total</span>
                    <span>S/ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-light-text font-medium">Método de Pago:</p>
                  
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button 
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                        paymentMethod === 'efectivo'
                          ? 'bg-accent text-dark-bg'
                          : 'bg-dark-bg border border-dark-border text-light-text/70 hover:border-accent'
                      }`}
                    >
                      💵 Efectivo
                    </button>
                    <button 
                      onClick={openYapeModal}
                      className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
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
                      className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                        paymentMethod === 'tarjeta'
                          ? 'bg-blue-600 text-white'
                          : 'bg-dark-bg border border-dark-border text-light-text/70 hover:border-blue-500'
                      }`}
                    >
                      💳 Tarjeta
                    </button>
                  </div>

                  {paymentMethod === 'efectivo' && (
                    <p className="text-xs text-light-text/50 hidden sm:block">
                      💵 El cliente pagará en efectivo al recoger
                    </p>
                  )}
                  {paymentMethod === 'yape' && (
                    <p className="text-xs text-purple-400 hidden sm:block">
                      📱 Escanea el QR y registra el número de operación
                    </p>
                  )}
                  {paymentMethod === 'tarjeta' && (
                    <p className="text-xs text-blue-400 hidden sm:block">
                      💳 Pago con tarjeta (Próximamente)
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || processingPayment}
                  className="w-full bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {processingPayment ? 'Procesando...' : `Cobrar S/ ${cartTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Pedidos Pendientes */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-lg sm:text-xl text-light-text">Pedidos Pendientes</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 sm:px-3 py-1 bg-accent/10 text-accent rounded-lg text-xs sm:text-sm">{realPendingOrders.length} pedidos</span>
                <button onClick={fetchData} className="p-2 hover:bg-dark-bg rounded-lg transition" title="Actualizar">
                  <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-20 text-accent">Cargando pedidos...</div>
            ) : realPendingOrders.length === 0 ? (
              <div className="bg-dark-surface border border-dark-border rounded-xl p-8 sm:p-12 text-center">
                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                <p className="text-light-text/70">No hay pedidos pendientes</p>
                <p className="text-light-text/50 text-sm mt-1">¡Excelente trabajo! Estás al día</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {realPendingOrders.map(order => (
                  <div key={order.id} className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6 hover:border-accent/50 transition">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div>
                        <h3 className="font-display font-bold text-light-text text-sm sm:text-base">{order.id?.slice(-8) || 'N/A'}</h3>
                        <p className="text-xs sm:text-sm text-light-text/70">{order.cliente?.nombre || 'Cliente General'}</p>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        order.estado === 'NUEVO' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.estado?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-light-text/60">
                        <span className="flex items-center gap-1">
                          <Package size={14} /> {order.items?.length || 0} items
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                        </span>
                      </div>
                      <span className="font-display font-bold text-accent text-sm sm:text-base">S/ {Number(order.total || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrepareOrder(order.id)}
                        className="flex-1 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-2 rounded-lg text-xs sm:text-sm transition"
                      >
                        {order.estado === 'NUEVO' ? 'Preparar' : 'Marcar Enviado'}
                      </button>
                      <button 
                        onClick={() => generateTicketPDF(order)}
                        className="p-2 bg-dark-bg border border-dark-border rounded-lg text-light-text/70 hover:text-accent transition"
                        title="Imprimir Ticket"
                      >
                        <Printer size={16} />
                      </button>
                      <button className="p-2 bg-dark-bg border border-dark-border rounded-lg text-light-text/70 hover:text-accent transition">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Consultar Stock */}
        {activeTab === 'stock' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-lg sm:text-xl text-light-text">Stock en Tiempo Real</h2>
              <button onClick={fetchData} className="p-2 hover:bg-dark-bg rounded-lg transition" title="Actualizar">
                <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {loadingData ? (
              <div className="text-center py-20 text-accent">Cargando inventario...</div>
            ) : (
              <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
                {/* ✅ Tabla con scroll horizontal en móvil */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-dark-bg border-b border-dark-border">
                      <tr>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Producto</th>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Código</th>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Stock Actual</th>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {realLowStockProducts.length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-light-text/50 text-sm">✅ No hay productos con stock bajo</td></tr>
                      ) : (
                        realLowStockProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-dark-bg/50 transition">
                            <td className="p-3 sm:p-4 text-light-text text-xs sm:text-sm">{product.nombre}</td>
                            <td className="p-3 sm:p-4 text-light-text/50 font-mono text-xs sm:text-sm">{product.id}</td>
                            <td className="p-3 sm:p-4 font-bold text-light-text text-xs sm:text-sm">{product.stock}</td>
                            <td className="p-3 sm:p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
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
              </div>
            )}
          </div>
        )}

        {/* TAB: Historial del Turno */}
        {activeTab === 'historial' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-lg sm:text-xl text-light-text">Historial de Ventas</h2>
              <span className="text-light-text/50 text-xs sm:text-sm">Fecha: {new Date().toLocaleDateString('es-PE')}</span>
            </div>

            {loadingData ? (
              <div className="text-center py-20 text-accent">Cargando historial...</div>
            ) : (
              <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
                {/* ✅ Tabla con scroll horizontal en móvil */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-dark-bg border-b border-dark-border">
                      <tr>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">ID Venta</th>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Cliente</th>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Hora</th>
                        <th className="text-left p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Método</th>
                        <th className="text-right p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Total</th>
                        <th className="text-center p-3 sm:p-4 text-light-text/70 text-xs sm:text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {realSalesHistory.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-light-text/50 text-sm">No hay ventas registradas hoy</td></tr>
                      ) : (
                        realSalesHistory.map(sale => (
                          <tr key={sale.id} className="hover:bg-dark-bg/50 transition">
                            <td className="p-3 sm:p-4 font-mono text-accent text-xs sm:text-sm">{sale.id?.slice(-8) || 'N/A'}</td>
                            <td className="p-3 sm:p-4 text-light-text text-xs sm:text-sm">{sale.cliente?.nombre || 'General'}</td>
                            <td className="p-3 sm:p-4 text-light-text/50 text-xs sm:text-sm">
                              {sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-light-text/70">
                                {sale.metodoPago || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-right font-display font-bold text-light-text text-xs sm:text-sm">
                              S/ {Number(sale.total || 0).toFixed(2)}
                            </td>
                            <td className="p-3 sm:p-4 text-center">
                              <button 
                                onClick={() => generateTicketPDF(sale)}
                                className="p-1.5 bg-dark-bg border border-dark-border rounded text-light-text/70 hover:text-accent transition"
                                title="Imprimir Ticket"
                              >
                                <Printer size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ✅ Resumen del Turno - Grid adaptable */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6">
                <p className="text-light-text/60 text-xs sm:text-sm mb-1">Total Vendido</p>
                <p className="text-xl sm:text-3xl font-display font-bold text-green-400">S/ {realStats.ventasHoy.toFixed(2)}</p>
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6">
                <p className="text-light-text/60 text-xs sm:text-sm mb-1">Transacciones</p>
                <p className="text-xl sm:text-3xl font-display font-bold text-blue-400">{realStats.pedidosHoy}</p>
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6">
                <p className="text-light-text/60 text-xs sm:text-sm mb-1">Promedio por Venta</p>
                <p className="text-xl sm:text-3xl font-display font-bold text-purple-400">S/ {realStats.ticketPromedio.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE PAGO YAPE - RESPONSIVE */}
      {showYapeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-dark-surface border border-dark-border rounded-2xl max-w-md w-full p-4 sm:p-6 animate-fadeIn my-4">
            
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-light-text">Pagar con Yape</h3>
                  <p className="text-xs sm:text-sm text-light-text/60">Escanea y registra el pago</p>
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

            <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-3 sm:mb-4 overflow-hidden border border-purple-100 p-2">
                <img 
                  src="/images/yape-qr.jpeg" 
                  alt="QR Yape" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=yape.pe/942318219";
                  }}
                />
              </div>
              
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">Total a pagar:</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">S/ {cartTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Número Yape: <span className="font-bold">942 318 219</span>
                </p>
                <p className="text-xs text-gray-500">
                  A nombre de: <span className="font-bold">FERREALTIPLANO</span>
                </p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm text-light-text/70 mb-2">
                Número de Operación Yape *
              </label>
              <input
                type="text"
                value={yapeReference}
                onChange={(e) => setYapeReference(e.target.value)}
                placeholder="Ej: 123456 o DNI del cliente"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-light-text focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-light-text/50 mt-1">
                Ingresa el código de operación o el DNI del titular
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowYapeModal(false);
                  setYapeReference('');
                }}
                className="flex-1 py-2.5 sm:py-3 bg-dark-bg border border-dark-border text-light-text rounded-lg font-medium hover:border-accent transition text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={processPayment}
                disabled={!yapeReference.trim() || processingPayment}
                className="flex-1 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {processingPayment ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>

            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
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