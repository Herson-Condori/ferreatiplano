import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Download, Package, Clock, CheckCircle } from 'lucide-react';

export default function Perfil() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:4000/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(data.data);
      } catch (err) {
        console.error('Error cargando pedidos:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'NUEVO': return 'bg-yellow-500/20 text-yellow-400';
      case 'EN_PREPARACION': return 'bg-blue-500/20 text-blue-400';
      case 'EN_CAMINO': return 'bg-purple-500/20 text-purple-400';
      case 'ENTREGADO': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Agrega esta función al componente Perfil
const downloadPDF = async (pedidoId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:4000/api/invoices/${pedidoId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante-${pedidoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      alert('Error descargando comprobante. Inténtalo más tarde.');
    }
  } catch (error) {
    console.error('Error descargando PDF:', error);
    alert('Error de conexión al descargar');
  }
};

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold text-accent">Mi Perfil</h1>
        <button 
          onClick={logout}
          className="text-light-text/60 hover:text-red-400 transition text-sm"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Datos del Usuario */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-light-text mb-4">Información Personal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-light-text/70">
          <p><span className="text-light-text/40">Nombre:</span> {user?.nombre}</p>
          <p><span className="text-light-text/40">Email:</span> {user?.email}</p>
          <p><span className="text-light-text/40">Teléfono:</span> {user?.telefono || 'No registrado'}</p>
          <p><span className="text-light-text/40">Dirección:</span> {user?.direccion || 'No registrada'}</p>
        </div>
      </div>

      {/* Historial de Pedidos */}
      <h2 className="text-xl font-semibold text-light-text mb-4">Historial de Pedidos</h2>
      
      {loading ? (
        <div className="text-center py-10 text-accent">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
          <Package size={48} className="mx-auto text-light-text/30 mb-4" />
          <p className="text-light-text/60 mb-4">Aún no tienes pedidos registrados</p>
          <button 
            onClick={() => navigate('/catalogo')}
            className="text-accent hover:underline"
          >
            Ir al catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(pedido => (
            <div key={pedido.id} className="bg-dark-surface border border-dark-border rounded-xl p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-light-text/40 text-sm">Pedido #{pedido.id.slice(-8)}</p>
                  <p className="font-display text-lg font-bold text-light-text">
                    S/ {Number(pedido.total).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pedido.estado)}`}>
                    {pedido.estado.replace('_', ' ')}
                  </span>
                  <span className="text-light-text/50 text-sm">
                    {new Date(pedido.createdAt).toLocaleDateString('es-PE')}
                  </span>
                </div>
              </div>

              {/* Items del pedido */}
              <div className="space-y-2 mb-4">
                {pedido.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-light-text/70">
                    <span>{item.cantidad}x {item.producto.nombre}</span>
                    <span>S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Footer del pedido */}
              <div className="flex flex-wrap justify-between items-center pt-4 border-t border-dark-border">
                <div className="flex items-center gap-2 text-light-text/60 text-sm">
                  <Clock size={16} />
                  <span>{pedido.metodoPago.replace('_', ' ')}</span>
                </div>
                
                {pedido.comprobante ? (
                  <button 
                    onClick={() => downloadPDF(pedido.id)}
                    className="flex items-center gap-2 text-accent hover:underline text-sm"
                  >
                    <Download size={16} /> Descargar Boleta
                  </button>
                ) : (
                  <span className="text-light-text/40 text-sm">
                    {pedido.estado === 'ENTREGADO' ? 'Comprobante en proceso' : 'Se emitirá al entregar'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}