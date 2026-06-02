// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import StatCard from './components/StatCard';
import { SalesOverviewChart, CategorySalesChart } from './components/SalesChart';
import { 
  DollarSign, ShoppingCart, TrendingUp, Package, 
  Users, FileText, AlertTriangle, Box
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    pedidosHoy: 0,
    ticketPromedio: 0,
    productosAgotados: 0,
    clientesNuevos: 0,
    tasaConversion: 0,
    boletasEmitidas: 0,
    totalProductos: 0,
    stockBajo: 0
  });

  // Datos dummy - Reemplazar con API real
  const salesData = [
    { name: 'Lun', ventas: 1200 },
    { name: 'Mar', ventas: 2100 },
    { name: 'Mié', ventas: 1800 },
    { name: 'Jue', ventas: 2400 },
    { name: 'Vie', ventas: 2180 },
    { name: 'Sáb', ventas: 2800 },
    { name: 'Dom', ventas: 1500 }
  ];

  const categoryData = [
    { name: 'Cemento', value: 35 },
    { name: 'Fierro', value: 25 },
    { name: 'Ladrillos', value: 20 },
    { name: 'Plomería', value: 10 },
    { name: 'Electricidad', value: 10 }
  ];

  useEffect(() => {
    // Aquí cargarías datos reales del backend
    // Por ahora usamos datos simulados
    setStats({
      ventasHoy: 2180.00,
      ventasMes: 58000.00,
      pedidosHoy: 16,
      ticketPromedio: 136.25,
      productosAgotados: 2,
      clientesNuevos: 34,
      tasaConversion: 68,
      boletasEmitidas: 142,
      totalProductos: 12,
      stockBajo: 1
    });
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Stats Grid - Primera fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Hoy"
          value={stats.ventasHoy.toFixed(2)}
          prefix="S/ "
          trend={12.4}
          trendLabel="vs ayer"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Pedidos Hoy"
          value={stats.pedidosHoy}
          trend={6.7}
          trendLabel="vs ayer"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Ticket Promedio"
          value={stats.ticketPromedio.toFixed(2)}
          prefix="S/ "
          trend={5.2}
          trendLabel="vs ayer"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Productos Agotados"
          value={stats.productosAgotados}
          trend={-1}
          trendLabel="con stock 0"
          icon={Package}
          color="red"
        />
      </div>

      {/* Stats Grid - Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas del Mes"
          value={stats.ventasMes.toFixed(2)}
          prefix="S/ "
          trend={18.3}
          trendLabel="vs mes ant."
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Clientes Nuevos"
          value={stats.clientesNuevos}
          trend={22.1}
          trendLabel="este mes"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Tasa de Conversión"
          value={stats.tasaConversion}
          suffix="%"
          trend={3.5}
          trendLabel="visitas→venta"
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Boletas Emitidas"
          value={stats.boletasEmitidas}
          trend={15}
          trendLabel="este mes"
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesOverviewChart data={salesData} />
        <CategorySalesChart data={categoryData} />
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/admin/productos/nuevo"
          className="bg-accent hover:bg-accent-hover text-dark-bg font-bold py-4 px-6 rounded-xl transition flex items-center justify-center gap-2"
        >
          <Package size={20} />
          Nuevo Producto
        </Link>
        <Link 
          to="/admin/productos"
          className="bg-dark-surface border border-dark-border hover:border-accent text-light-text font-bold py-4 px-6 rounded-xl transition flex items-center justify-center gap-2"
        >
          <Box size={20} />
          Gestionar Productos
        </Link>
        <Link 
          to="/admin/pedidos"
          className="bg-dark-surface border border-dark-border hover:border-accent text-light-text font-bold py-4 px-6 rounded-xl transition flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          Ver Pedidos
        </Link>
      </div>

      {/* Alertas de stock */}
      {stats.stockBajo > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400" size={24} />
          <div>
            <p className="text-red-400 font-bold">Alertas de Stock</p>
            <p className="text-light-text/70 text-sm">
              {stats.stockBajo} producto(s) con stock bajo. Revisa el inventario.
            </p>
          </div>
          <Link to="/admin/inventario" className="ml-auto text-accent hover:underline text-sm font-medium">
            Ver inventario →
          </Link>
        </div>
      )}
    </div>
  );
}