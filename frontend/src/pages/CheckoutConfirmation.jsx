// src/pages/CheckoutConfirmation.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Smartphone, Banknote, ArrowLeft, Download, Share2 } from 'lucide-react';

export default function CheckoutConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { metodoPago } = location.state || {};
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch order details
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await fetch(`http://localhost:4000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-accent">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Éxito */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={64} className="text-green-400" />
          </div>
          <h1 className="font-display text-4xl font-bold text-light-text mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-light-text/60">
            Tu pedido ha sido registrado exitosamente
          </p>
        </div>

        {/* Info del Pedido */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-dark-border">
            <div>
              <p className="text-light-text/60 text-sm">Número de Pedido</p>
              <p className="font-display text-2xl font-bold text-accent">#{id?.slice(-6).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-light-text/60 text-sm">Fecha</p>
              <p className="text-light-text font-medium">
                {new Date().toLocaleDateString('es-PE')}
              </p>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="flex items-center gap-3 p-4 bg-dark-bg rounded-lg mb-4">
            {metodoPago === 'efectivo' ? (
              <>
                <Banknote size={24} className="text-green-400" />
                <div>
                  <p className="text-light-text font-medium">Pago en Efectivo</p>
                  <p className="text-light-text/60 text-sm">Paga al recibir tu pedido</p>
                </div>
              </>
            ) : (
              <>
                <Smartphone size={24} className="text-purple-400" />
                <div>
                  <p className="text-light-text font-medium">Yape</p>
                  <p className="text-light-text/60 text-sm">Envía el comprobante al 942318219</p>
                </div>
              </>
            )}
          </div>

          {/* Estado del Pedido */}
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <Package size={24} className="text-yellow-400" />
            <div>
              <p className="text-yellow-400 font-medium">Estado: EN PROCESO</p>
              <p className="text-yellow-400/60 text-sm">
                {metodoPago === 'yape' ? 'Esperando confirmación de pago' : 'Preparando tu pedido'}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => window.open(`https://wa.me/51942318219?text=Hola,%20acabo%20de%20hacer%20un%20pedido%20#${id?.slice(-6).toUpperCase()}`, '_blank')}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition"
          >
            <Share2 size={18} />
            Enviar Comprobante
          </button>
          <button 
            onClick={() => navigate('/perfil/pedidos')}
            className="flex items-center justify-center gap-2 bg-dark-bg border border-dark-border hover:border-accent text-light-text font-bold py-3 rounded-lg transition"
          >
            <Package size={18} />
            Ver mis Pedidos
          </button>
        </div>

        {/* Volver al Inicio */}
        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 text-light-text/70 hover:text-accent transition py-3"
        >
          <ArrowLeft size={18} />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}