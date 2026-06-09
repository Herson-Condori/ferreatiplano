// src/pages/Checkout.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, QrCode, Truck, CheckCircle, Loader2, MapPin, X, Banknote, Smartphone } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import GoogleMapComponent from '../components/maps/GoogleMap';
import AddressAutocomplete from '../components/maps/AddressAutocomplete';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const total = getTotal();

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  
  // Estados de formulario
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    referencia: '',
    ruc: ''
  });
  
  // Estados de pago
  const [metodoPago, setMetodoPago] = useState('CONTRA_ENTREGA');
  const [yapeReference, setYapeReference] = useState('');

  // Estados de Google Maps / Delivery
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -15.5045, lng: -70.1359 }); // Juliaca
  const [mapMarkers, setMapMarkers] = useState([
    {
      position: { lat: -15.5045, lng: -70.1359 },
      title: 'FERREALTIPLANO',
      address: 'Av. Ilave 1234, Juliaca',
      icon: { url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' }
    }
  ]);

  const [orderCoordinates, setOrderCoordinates] = useState({ lat: null, lng: null });

  // ─────────────────────────────────────────────────────────────
  // 🗺️ Función para calcular delivery con API del backend
  // ─────────────────────────────────────────────────────────────
  const calculateDelivery = useCallback(async (address) => {
    if (!address || address.length < 5) return;

    setCalculatingDelivery(true);
    setError('');
    
    try {
      const { data } = await axios.post('http://localhost:4000/api/delivery/calculate', { address });

      if (data.success) {
        setDeliveryInfo(data.data);
        setMapCenter({ lat: data.data.coordinates.lat, lng: data.data.coordinates.lng });
        setOrderCoordinates({ lat: data.data.coordinates.lat, lng: data.data.coordinates.lng });
        
        setMapMarkers([
          mapMarkers[0], // Tienda
          {
            position: data.data.coordinates,
            title: 'Dirección de entrega',
            address: data.data.address,
            icon: { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }
          }
        ]);
      }
    } catch (err) {
      console.error('Error calculando delivery:', err);
      setDeliveryInfo(null);
    } finally {
      setCalculatingDelivery(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 🔄 Efecto: Calcular delivery cuando cambia la dirección
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (formData.direccion.length >= 10) {
      const timeoutId = setTimeout(() => {
        calculateDelivery(formData.direccion);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.direccion, calculateDelivery]);

  // ─────────────────────────────────────────────────────────────
  // 📝 Manejadores de formulario
  // ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAddressSelect = (prediction) => {
    setFormData(prev => ({ ...prev, direccion: prediction.description }));
    calculateDelivery(prediction.description);
  };

  const clearDelivery = () => {
    setDeliveryInfo(null);
    setOrderCoordinates({ lat: null, lng: null });
    setMapMarkers([mapMarkers[0]]);
  };

  // ─────────────────────────────────────────────────────────────
  // 🛒 Envío del pedido
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (items.length === 0) {
      setError('Tu carrito está vacío');
      return;
    }

    if (!formData.direccion.trim()) {
      setError('La dirección de entrega es requerida');
      return;
    }

    if (metodoPago === 'YAPE' && !yapeReference.trim()) {
      setError('Ingresa el número de operación o referencia de Yape');
      return;
    }

    let finalLat = orderCoordinates.lat;
    let finalLng = orderCoordinates.lng;
    let finalDeliveryCost = deliveryInfo?.deliveryCost || 10.00;

    // Fallback si no hay coordenadas
    if (!finalLat || !finalLng) {
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:4000/api/delivery/calculate', {
          address: formData.direccion
        });
        if (response.data.success) {
          finalLat = response.data.data.coordinates.lat;
          finalLng = response.data.data.coordinates.lng;
          finalDeliveryCost = response.data.data.deliveryCost;
        }
      } catch (err) {
        finalLat = -15.5045;
        finalLng = -70.1359;
        finalDeliveryCost = 10.00;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          cantidad: item.cantidad,
          precioUnitario: item.precio
        })),
        direccionEntrega: `${formData.direccion}${formData.referencia ? ` - ${formData.referencia}` : ''}`,
        lat: finalLat,
        lng: finalLng,
        costoDelivery: finalDeliveryCost,
        notas: formData.ruc ? `RUC: ${formData.ruc}` : '',
        metodoPago,
        ...(metodoPago === 'YAPE' && { yapeReference })
      };

      const response = await axios.post('http://localhost:4000/api/orders', orderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess(response.data);
      clearCart();
      
      setTimeout(() => {
        navigate('/perfil', { state: { newOrder: response.data.data } });
      }, 3000);

    } catch (err) {
      console.error('Error creando pedido:', err);
      setError(err.response?.data?.error || 'Error procesando tu pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ✅ Vista de éxito (pedido confirmado)
  // ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-accent mb-2">
            ¡Pedido Confirmado!
          </h2>
          <p className="text-light-text/70 mb-4">{success.message || 'Tu pedido ha sido registrado.'}</p>
          
          <div className="bg-dark-bg rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-light-text/60">Número de pedido</p>
            <p className="font-mono font-bold text-light-text">{success.data?.pedidoId || 'N/A'}</p>
            <p className="text-sm text-light-text/60 mt-2">Total a pagar</p>
            <p className="font-display font-bold text-accent">S/ {(total + (deliveryInfo?.deliveryCost || 10)).toFixed(2)}</p>
            {deliveryInfo && (
              <>
                <p className="text-sm text-light-text/60 mt-2">Delivery</p>
                <p className="text-light-text">
                  {deliveryInfo.distance} • {deliveryInfo.isFree ? 'GRATIS' : `S/ ${deliveryInfo.deliveryCost.toFixed(2)}`}
                </p>
              </>
            )}
          </div>
          
          {metodoPago === 'YAPE' && (
            <p className="text-yellow-400 text-sm mb-4 bg-yellow-500/10 p-3 rounded border border-yellow-500/30">
              📸 Recuerda enviar la captura de tu pago Yape a nuestro WhatsApp para confirmar el despacho.
            </p>
          )}
          
          <p className="text-light-text/50 text-sm">Redirigiendo a tu perfil...</p>
        </div>
      </div>
    );
  }

  const dynamicDeliveryCost = deliveryInfo?.deliveryCost ?? 10.00;
  const totalWithDelivery = total + dynamicDeliveryCost;

  // ─────────────────────────────────────────────────────────────
  // 🎨 Vista principal del Checkout
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="font-display text-3xl font-bold text-accent mb-2">Finalizar Compra</h1>
      <p className="text-light-text/60 mb-6">Completa tus datos y selecciona cómo deseas pagar</p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="hover:text-red-300"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Formulario + Mapa */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 📍 Datos de Entrega */}
          <div className="bg-dark-surface border border-dark-border p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-light-text mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-accent" /> Datos de Entrega
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                name="nombre" 
                placeholder="Nombre completo *" 
                value={formData.nombre}
                onChange={handleChange}
                className="bg-dark-bg border border-dark-border rounded p-3 text-light-text focus:border-accent outline-none" 
                required
              />
              <input 
                name="telefono" 
                placeholder="Celular / WhatsApp *" 
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                className="bg-dark-bg border border-dark-border rounded p-3 text-light-text focus:border-accent outline-none" 
                required
              />
              <div className="sm:col-span-2">
                <label className="block text-light-text/70 text-sm mb-1">Dirección de entrega *</label>
                <AddressAutocomplete 
                  initialValue={formData.direccion}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Ej: Av. Ilave 1234, Juliaca"
                />
              </div>
              <div className="sm:col-span-2">
                <input 
                  name="referencia" 
                  placeholder="Referencia (Ej: Frente al colegio, casa de puerta azul)" 
                  value={formData.referencia}
                  onChange={handleChange}
                  className="w-full bg-dark-bg border border-dark-border rounded p-3 text-light-text focus:border-accent outline-none" 
                />
              </div>
              <div className="sm:col-span-2">
                <input 
                  name="ruc" 
                  placeholder="RUC (opcional, para generar boleta/factura)" 
                  value={formData.ruc}
                  onChange={handleChange}
                  className="w-full bg-dark-bg border border-dark-border rounded p-3 text-light-text focus:border-accent outline-none" 
                />
              </div>
            </div>

            {calculatingDelivery && (
              <div className="mt-4 flex items-center gap-2 text-accent text-sm">
                <Loader2 size={16} className="animate-spin" />
                Calculando zona y costo de delivery...
              </div>
            )}

            {deliveryInfo && (
              <div className="mt-4 p-4 bg-dark-bg border border-accent/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-accent flex-shrink-0 mt-1" size={18} />
                    <div>
                      <p className="text-light-text font-medium text-sm">{deliveryInfo.address}</p>
                      <p className="text-light-text/60 text-xs mt-1">
                        🚚 {deliveryInfo.distance} • ⏱️ {deliveryInfo.duration}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={clearDelivery}
                    className="text-light-text/40 hover:text-red-400 transition"
                    title="Quitar dirección"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-dark-border">
                  <span className="text-light-text/70 text-sm">Costo de delivery:</span>
                  <span className={`font-display font-bold ${deliveryInfo.isFree ? 'text-green-400' : 'text-accent'}`}>
                    {deliveryInfo.isFree ? '✅ GRATIS' : `S/ ${deliveryInfo.deliveryCost.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            {/* 🗺️ Mapa de Ubicación */}
            <div className="mt-6">
              <h3 className="text-light-text font-medium mb-3 text-sm">Ubicación de entrega</h3>
              <div className="h-56 rounded-lg overflow-hidden border border-dark-border">
                {/*<GoogleMapComponent
                  center={mapCenter}
                  zoom={deliveryInfo ? 14 : 13}
                  markers={mapMarkers}
                  height="100%"
                />*/}
              </div>
            </div>
          </div>

          {/* 💳 Método de Pago */}
          <div className="bg-dark-surface border border-dark-border p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-light-text mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-accent" /> Método de Pago
            </h2>
            <div className="space-y-3">
              
              {/* 1. Contra Entrega (Efectivo) */}
              <label 
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                  metodoPago === 'CONTRA_ENTREGA' ? 'border-accent bg-accent/5' : 'border-dark-border hover:border-accent/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="pago" 
                  value="CONTRA_ENTREGA" 
                  checked={metodoPago === 'CONTRA_ENTREGA'} 
                  onChange={() => setMetodoPago('CONTRA_ENTREGA')}
                  className="hidden" 
                />
                <div className="p-2 bg-green-500/10 rounded-full"><Banknote size={24} className="text-green-400" /></div>
                <div className="flex-grow">
                  <p className="font-bold text-light-text">Pago en Efectivo (Contra Entrega)</p>
                  <p className="text-xs text-light-text/60 mt-1">Pagas al recibir el pedido en la puerta de tu casa</p>
                </div>
              </label>

              {/* 2. Yape / Plin */}
              <label 
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                  metodoPago === 'YAPE' ? 'border-accent bg-accent/5' : 'border-dark-border hover:border-accent/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="pago" 
                  value="YAPE" 
                  checked={metodoPago === 'YAPE'} 
                  onChange={() => setMetodoPago('YAPE')} 
                  className="hidden" 
                />
                <div className="p-2 bg-purple-500/10 rounded-full"><Smartphone size={24} className="text-purple-400" /></div>
                <div className="flex-grow">
                  <p className="font-bold text-light-text">Yape / Plin</p>
                  <p className="text-xs text-light-text/60 mt-1">Escanea el QR y envía el comprobante por WhatsApp</p>
                </div>
              </label>
              
              {metodoPago === 'YAPE' && (
                <div className="ml-4 sm:ml-14 mt-2 p-4 bg-dark-bg rounded-lg border border-purple-500/30 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-3">
                    <div className="w-28 h-28 bg-white rounded-lg flex items-center justify-center flex-shrink-0 p-2 border border-purple-100">
                      {/* Reemplaza esta URL con tu QR real de Yape */}
                      <img 
                        src="/images/yape-qr.jpeg" 
                        alt="QR Yape" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=yape.pe/942318219";
                        }}
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-light-text font-medium">Escanea para pagar</p>
                      <p className="text-xs text-light-text/60 mt-1">Número: <span className="font-bold text-purple-400">942 318 219</span></p>
                      <p className="text-xs text-light-text/60 mt-1">A nombre de: <span className="font-bold">FERREALTIPLANO</span></p>
                      <p className="text-xs text-yellow-400 mt-2">💡 Total a transferir: <span className="font-bold">S/ {totalWithDelivery.toFixed(2)}</span></p>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Número de operación o DNI del titular *" 
                    value={yapeReference}
                    onChange={(e) => setYapeReference(e.target.value)}
                    className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2.5 text-light-text text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}

              {/* 3. Tarjeta (Próximamente) */}
              <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-dark-border bg-dark-bg/30 opacity-70 cursor-not-allowed">
                <div className="p-2 bg-gray-500/10 rounded-full">
                  <CreditCard size={24} className="text-gray-400" />
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-light-text/70">Tarjeta de Crédito / Débito</p>
                  <p className="text-xs text-light-text/50 mt-1">Próximamente - Visa, MasterCard (Integración Culqi)</p>
                </div>
                <span className="text-xs bg-dark-border px-2 py-1 rounded text-light-text/50 font-medium">
                  Pronto
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen del Pedido */}
        <div className="lg:col-span-1">
          <div className="bg-dark-surface border border-dark-border p-6 rounded-xl sticky top-24">
            <h2 className="text-xl font-semibold text-light-text mb-4">Resumen del Pedido</h2>
            
            <div className="space-y-3 mb-6 max-h-52 overflow-y-auto custom-scrollbar pr-2">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-light-text/70 truncate w-2/3">
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span className="text-light-text font-medium flex-shrink-0 ml-2">
                    S/ {(item.precio * item.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dark-border pt-4 space-y-2">
              <div className="flex justify-between text-light-text/60 text-sm">
                <span>Subtotal</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-light-text/60 text-sm">
                <span>Delivery</span>
                <span className={deliveryInfo?.isFree ? 'text-green-400 font-medium' : ''}>
                  {deliveryInfo?.isFree ? 'GRATIS 🎉' : `S/ ${dynamicDeliveryCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-xl font-display font-bold text-accent pt-3 border-t border-dark-border mt-3">
                <span>Total</span>
                <span>S/ {totalWithDelivery.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="w-full mt-6 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-accent/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Procesando pedido...
                </>
              ) : (
                <>
                  <CheckCircle size={20} /> Confirmar Pedido
                </>
              )}
            </button>

            <button 
              onClick={() => navigate('/catalogo')} 
              className="w-full mt-3 text-sm text-light-text/60 hover:text-accent transition flex items-center justify-center gap-1"
            >
              ← Seguir comprando
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}