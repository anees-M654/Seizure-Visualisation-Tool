
import React, { useMemo } from 'react';
import { SeizureRecord } from '../types';
import { TrendingUp, TrendingDown, Package, MapPin, Calendar, Layers, PoundSterling, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface SummaryStatsProps {
  data: SeizureRecord[];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ data }) => {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    // 1. Total Seizures
    const total = data.length;

    // 2. Most Active Category
    const categoryCounts: Record<string, number> = {};
    data.forEach(d => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // 3. Normalized Temporal Average & Trend
    const dates = data.map(d => new Date(d.date).getTime()).sort((a, b) => a - b);
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const diffMs = maxDate - minDate;
    const diffDays = Math.max(1, diffMs / (1000 * 60 * 60 * 24));
    
    let avgLabel = "Avg / Month";
    let avgValue = (total / (diffDays / 30.44)).toFixed(1);

    if (diffDays < 14) {
      avgLabel = "Avg / Day";
      avgValue = (total / diffDays).toFixed(1);
    } else if (diffDays < 60) {
      avgLabel = "Avg / Week";
      avgValue = (total / (diffDays / 7)).toFixed(1);
    }

    // Trend: Compare second half of period vs first half
    const midPoint = minDate + (diffMs / 2);
    const recentCount = data.filter(d => new Date(d.date).getTime() >= midPoint).length;
    const olderCount = data.filter(d => new Date(d.date).getTime() < midPoint).length;
    const trend = olderCount === 0 ? 0 : Math.round(((recentCount - olderCount) / olderCount) * 100);

    // 4. Weighted Primary Hub (Weighted by Quantity)
    const cityWeights: Record<string, number> = {};
    data.forEach(d => {
      cityWeights[d.city] = (cityWeights[d.city] || 0) + (d.quantity || 1);
    });
    const topCity = Object.entries(cityWeights)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // 5. Quantity and Value Densities
    const totalQuantity = data.reduce((acc, d) => acc + (d.quantity || 0), 0);
    const totalValue = data.reduce((acc, d) => acc + ((d as any).estimatedValue || 0), 0);

    return { 
      total, 
      topCategory, 
      avgValue, 
      avgLabel, 
      topCity, 
      totalQuantity, 
      totalValue,
      trend
    };
  }, [data]);

  if (!stats) return null;

  const IntelligenceTooltip: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 p-3 bg-[#0b1c3d] text-white text-[10px] leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] shadow-2xl border border-blue-900/50 -translate-y-2 group-hover:translate-y-0">
      <div className="flex items-center gap-2 mb-2 border-b border-blue-800/50 pb-2">
        <Info size={12} className="text-blue-400" />
        <span className="font-black uppercase tracking-widest text-blue-400">{title}</span>
      </div>
      <p className="text-blue-100/80 font-medium leading-normal">{content}</p>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-px border-8 border-transparent border-b-[#0b1c3d]" />
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
          <TrendingUp className="text-blue-600" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Total Seizures</p>
          <p className="text-base font-black text-slate-800">{stats.total}</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <Layers className="text-slate-600" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Total Quantity</p>
          <p className="text-base font-black text-slate-800">{stats.totalQuantity.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
          <Package className="text-emerald-600" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Top Category</p>
          <p className="text-base font-black text-slate-800 truncate">{stats.topCategory}</p>
        </div>
      </div>

      <div 
        className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center gap-1 relative group cursor-help"
      >
        <IntelligenceTooltip 
          title="Operational Trend" 
          content="Compares seizure frequency in the second half of the selected timeframe against the first half to identify rising or falling activity." 
        />
        <div className="absolute top-2 right-2 text-slate-300 group-hover:text-blue-500 transition-colors">
          <Info size={12} />
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
            <Calendar className="text-amber-600" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{stats.avgLabel}</p>
            <p className="text-base font-black text-slate-800">{stats.avgValue}</p>
          </div>
        </div>
        {stats.trend !== 0 && (
          <div className={`flex items-center gap-1 text-[9px] font-bold ${stats.trend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {stats.trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(stats.trend)}% vs prev. period
          </div>
        )}
      </div>

      <div 
        className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 relative group cursor-help"
      >
        <IntelligenceTooltip 
          title="Weighted Hub Logic" 
          content="Cities are ranked by the total volume (quantity) of items seized, ensuring large-scale shipments take precedence over high-frequency small incidents." 
        />
        <div className="absolute top-2 right-2 text-slate-300 group-hover:text-blue-500 transition-colors">
          <Info size={12} />
        </div>
        <div className="bg-violet-50 p-2 rounded-xl border border-violet-100">
          <MapPin className="text-violet-600" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Weighted Hub</p>
          <p className="text-base font-black text-slate-800 truncate">{stats.topCity}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;
