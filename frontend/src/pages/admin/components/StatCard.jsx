// src/pages/admin/components/StatCard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  prefix = '', 
  suffix = '',
  trend, 
  trendLabel, 
  icon: Icon, 
  color = 'blue',
  size = 'normal'
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400'
  };

  const isPositive = trend > 0;

  return (
    <div className={`bg-dark-surface border border-dark-border rounded-xl p-6 hover:border-accent/30 transition group ${size === 'large' ? 'col-span-2' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="font-medium">{Math.abs(trend)}%</span>
            <span className="text-light-text/50">{trendLabel}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-light-text/60 text-sm mb-1">{title}</p>
        <p className={`font-display font-bold text-light-text ${size === 'large' ? 'text-4xl' : 'text-2xl'}`}>
          {prefix}{value}{suffix}
        </p>
      </div>
    </div>
  );
}