// src/pages/QuickCheckout.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Banknote, Smartphone, CheckCircle, ArrowLeft, 
  QrCode, Loader2, X, AlertCircle 
} from 'lucide-react';

export default function QuickCheckout() {
  const { id } = useParams(); // ID del producto
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(parseInt(searchParams.get('cantidad')) || 1);
  const [metodoPago, setMetodoPago] = useState('');
  const [yapeReference, setYapeReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Cargar producto
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`http://localhost:4000/api/products/${id}`);
        setProduct(data.data);
      } catch (err) {
        setError('Producto no encontrado');
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!metodoPago) {
      setError('Selecciona un método de pago');
      return;
    }

    if (metodoPago === 'YAPE' && !yapeReference.trim()) {
      setError('Ingresa el número de operación de Yape');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: [{
          productId: id,
          cantidad: quantity,
          precioUnitario: product.precio
        }],
        direccionEntrega: 'Recoger en tienda',
        lat: -15.5045,
        lng: -70.1359,
        costoDelivery: 0,
        metodoPago,
        notas: `COMPRA RÁPIDA - ${user?.nombre || 'Cliente'}`,
        ...(metodoPago === 'YAPE' && { yapeReference })
      };

      await axios.post('http://localhost:4000/api/orders', orderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/perfil/pedidos');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Error procesando el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <div className="p-12 text-center text-accent">Cargando...</div>;

  const total = product.precio * quantity;

  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-accent mb-2">
            ¡Pedido Confirmado!
          </h2>
          <p className="text-light-text/70 mb-4">
            Tu compra rápida ha sido registrada
          </p>
          <div className="bg-dark-bg rounded-lg p-4 mb-6">
            <p className="text-sm text-light-text/60">Producto</p>
            <p className="font-bold text-light-text">{product.nombre}</p>
            <p className="text-sm text-light-text/60 mt-2">Cantidad: {quantity}</p>
            <p className="text-sm text-light-text/60">Total pagado</p>
            <p className="font-display font-bold text-accent text-xl">S/ {total.toFixed(2)}</p>
          </div>
          {metodoPago === 'YAPE' && (
            <p className="text-yellow-400 text-sm mb-4 bg-yellow-500/10 p-3 rounded">
              📸 Envía tu comprobante al WhatsApp 942318219
            </p>
          )}
          <p className="text-light-text/50 text-sm">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-light-text/70 hover:text-accent mb-6 transition"
        >
          <ArrowLeft size={20} />
          Volver al producto
        </button>

        <h1 className="font-display text-3xl font-bold text-accent mb-2">
          Compra Rápida
        </h1>
        <p className="text-light-text/60 mb-6">
          Completa tu compra en segundos. Recoger en tienda.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:text-red-300"><X size={16} /></button>
          </div>
        )}

        {/* Producto */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <img 
              src={product.imagenes?.[0] || 'https://via.placeholder.com/100'} 
              alt={product.nombre}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-bold text-light-text text-lg">{product.nombre}</h3>
              <p className="text-light-text/60 text-sm">Cantidad: {quantity}</p>
              <p className="text-accent font-display font-bold text-xl mt-1">
                S/ {total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Método de Pago */}
        <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-light-text mb-4">Método de Pago</h2>
          
          <div className="space-y-3 mb-6">
            {/* Efectivo */}
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
                <p className="font-bold text-light-text">Pago en Efectivo</p>
                <p className="text-xs text-light-text/60 mt-1">Recoges y pagas en tienda</p>
              </div>
            </label>

            {/* Yape */}
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
                <p className="font-bold text-light-text">Yape</p>
                <p className="text-xs text-light-text/60 mt-1">Escanea y paga ahora</p>
              </div>
            </label>
            
            {metodoPago === 'YAPE' && (
              <div className="ml-4 sm:ml-14 mt-2 p-4 bg-dark-bg rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center flex-shrink-0 p-2 border border-purple-100">
                    <img 
                      src="/images/yape-qr.jpeg" 
                      alt="QR Yape" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=yape.pe/942318219";
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-light-text font-medium">Escanea para pagar</p>
                    <p className="text-xs text-light-text/60 mt-1">Número: <span className="font-bold text-purple-400">942 318 219</span></p>
                    <p className="text-xs text-yellow-400 mt-2">Total: <span className="font-bold">S/ {total.toFixed(2)}</span></p>
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="Número de operación *" 
                  value={yapeReference}
                  onChange={(e) => setYapeReference(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2.5 text-light-text text-sm focus:outline-none focus:border-purple-400"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !metodoPago}
            className="w-full bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={20} /> Procesando...</>
            ) : (
              <><CheckCircle size={20} /> Confirmar Pago - S/ {total.toFixed(2)}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}