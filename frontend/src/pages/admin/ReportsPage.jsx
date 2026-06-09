// src/pages/admin/ReportsPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Calendar, DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#E8A020', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = `fechaInicio=${dates.start}&fechaFin=${dates.end}`;
      
      // Paralelizar llamadas
      const [reportRes, historyRes] = await Promise.all([
        axios.get(`http://localhost:4000/api/reports/sales?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://localhost:4000/api/reports/history?${params}&limit=5`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setReport(reportRes.data.data);
      setHistory(historyRes.data.data);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Cargar al inicio

  const handleExport = () => {
    alert('Exportando reporte a Excel/CSV... (Funcionalidad a implementar)');
  };

  if (loading) return <div className="p-6 text-center text-accent">Generando reportes...</div>;

  const resumen = report?.resumen || {};
  const topProducts = report?.productosTop || [];
  
  // Preparar datos para gráfico de torta (Métodos de pago)
  const paymentData = (report?.porMetodoPago || []).map(p => ({
    name: p.metodoPago,
    value: p._sum.total
  }));

  return (
    <div className="space-y-6">
      
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-surface p-4 rounded-xl border border-dark-border">
        <div>
          <h1 className="font-display text-2xl text-light-text">Reportes y Analítica</h1>
          <p className="text-light-text/60 text-sm">Resumen de rendimiento del negocio</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-dark-bg px-3 py-2 rounded-lg border border-dark-border">
            <Calendar size={16} className="text-light-text/50" />
            <input 
              type="date" 
              value={dates.start}
              onChange={(e) => setDates({...dates, start: e.target.value})}
              className="bg-transparent text-light-text text-sm focus:outline-none"
            />
            <span className="text-light-text/50">-</span>
            <input 
              type="date" 
              value={dates.end}
              onChange={(e) => setDates({...dates, end: e.target.value})}
              className="bg-transparent text-light-text text-sm focus:outline-none"
            />
          </div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-accent text-dark-bg font-bold rounded-lg hover:bg-accent-hover transition"
          >
            Generar
          </button>
          <button 
            onClick={handleExport}
            className="p-2 bg-dark-bg border border-dark-border rounded-lg text-light-text hover:border-accent transition"
            title="Exportar"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-surface border border-dark-border p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg"><DollarSign className="text-green-400" /></div>
            <span className="text-green-400 text-sm font-medium">Total Ventas</span>
          </div>
          <p className="text-3xl font-display font-bold text-light-text">S/ {Number(resumen.totalVentas || 0).toFixed(2)}</p>
        </div>

        <div className="bg-dark-surface border border-dark-border p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg"><ShoppingCart className="text-blue-400" /></div>
            <span className="text-blue-400 text-sm font-medium">Pedidos</span>
          </div>
          <p className="text-3xl font-display font-bold text-light-text">{resumen.totalPedidos || 0}</p>
        </div>

        <div className="bg-dark-surface border border-dark-border p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent/10 rounded-lg"><TrendingUp className="text-accent" /></div>
            <span className="text-accent text-sm font-medium">Ticket Promedio</span>
          </div>
          <p className="text-3xl font-display font-bold text-light-text">S/ {Number(resumen.ticketPromedio || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Gráficos y Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico: Top Productos */}
        <div className="bg-dark-surface border border-dark-border p-6 rounded-xl">
          <h3 className="font-display text-lg text-light-text mb-4 flex items-center gap-2">
            <Package size={18} className="text-accent" /> Productos Más Vendidos
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2E2B24" />
                <XAxis type="number" stroke="#F0EDE6" />
                <YAxis dataKey="nombre" type="category" width={100} stroke="#F0EDE6" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1916', border: '1px solid #2E2B24' }} />
                <Bar dataKey="cantidadVendida" fill="#E8A020" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico: Métodos de Pago */}
        <div className="bg-dark-surface border border-dark-border p-6 rounded-xl">
          <h3 className="font-display text-lg text-light-text mb-4">Distribución por Método de Pago</h3>
          <div className="h-64 flex items-center justify-center">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1916', border: '1px solid #2E2B24' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-light-text/50">Sin datos de pagos en este periodo</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabla: Últimos Pedidos del Periodo */}
      <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h3 className="font-display text-lg text-light-text">Últimos Pedidos del Periodo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-bg text-light-text/70">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {history.map(pedido => (
                <tr key={pedido.id} className="hover:bg-dark-bg/50">
                  <td className="p-3 font-mono text-accent">#{pedido.id.slice(-6)}</td>
                  <td className="p-3 text-light-text">{pedido.cliente?.nombre || 'Invitado'}</td>
                  <td className="p-3 text-light-text/60">{new Date(pedido.createdAt).toLocaleDateString('es-PE')}</td>
                  <td className="p-3 font-bold text-light-text">S/ {Number(pedido.total || 0).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      pedido.estado === 'ENTREGADO' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {pedido.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}