
import React, { useMemo } from 'react';
import { SeizureRecord } from '../types';
import { TrendingUp, Package, MapPin, Calendar } from 'lucide-react';

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

    // 3. Average Seizures per Month
    // Find date range
    const dates = data.map(d => new Date(d.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffMs = maxDate - minDate;
    const diffMonths = Math.max(1, diffMs / (1000 * 60 * 60 * 24 * 30.44));
    const avgPerMonth = (total / diffMonths).toFixed(1);

    // 4. Top City
    const cityCounts: Record<string, number> = {};
    data.forEach(d => {
      cityCounts[d.city] = (cityCounts[d.city] || 0) + 1;
    });
    const topCity = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total, topCategory, avgPerMonth, topCity };
  }, [data]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
          <Package className="text-emerald-600" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Top Category</p>
          <p className="text-base font-black text-slate-800 truncate">{stats.topCategory}</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
          <Calendar className="text-amber-600" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Avg / Month</p>
          <p className="text-base font-black text-slate-800">{stats.avgPerMonth}</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="bg-violet-50 p-2 rounded-xl border border-violet-100">
          <MapPin className="text-violet-600" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Primary Hub</p>
          <p className="text-base font-black text-slate-800 truncate">{stats.topCity}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;
