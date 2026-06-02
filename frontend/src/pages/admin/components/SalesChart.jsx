// src/pages/admin/components/SalesChart.jsx
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function SalesOverviewChart({ data }) {
  const [period, setPeriod] = useState('week');

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold text-light-text">Ventas</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              period === 'week' ? 'bg-accent text-dark-bg' : 'bg-dark-bg text-light-text/70'
            }`}
          >
            Semana
          </button>
          <button 
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              period === 'month' ? 'bg-accent text-dark-bg' : 'bg-dark-bg text-light-text/70'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E2B24" />
          <XAxis dataKey="name" stroke="#F0EDE6" fontSize={12} />
          <YAxis stroke="#F0EDE6" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1A1916', border: '1px solid #2E2B24', borderRadius: '8px' }}
            itemStyle={{ color: '#E8A020' }}
          />
          <Bar dataKey="ventas" fill="#E8A020" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategorySalesChart({ data }) {
  const COLORS = ['#E8A020', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B'];

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
      <h3 className="font-display text-lg font-bold text-light-text mb-6">Ventas por Categoría</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1A1916', border: '1px solid #2E2B24', borderRadius: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}