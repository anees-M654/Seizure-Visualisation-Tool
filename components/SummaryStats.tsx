import React, { useMemo } from 'react';
import { SeizureRecord } from '../types';
import { TrendingUp, Package, MapPin, Calendar, Layers, ArrowUpRight, ArrowDownRight, Info, Target } from 'lucide-react';

const IntelligenceTooltip: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 p-3 bg-[#0b1c3d] text-white text-[10px] leading-relaxed rounded-xl opacity-0 xl:group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] shadow-2xl border border-blue-900/50 -translate-y-2 xl:group-hover:translate-y-0 hidden xl:block">
    <div className="flex items-center gap-2 mb-2 border-b border-blue-800/50 pb-2">
      <Info size={12} className="text-blue-400" />
      <span className="font-black uppercase tracking-widest text-blue-400">{title}</span>
    </div>
    <p className="text-blue-100/80 font-medium leading-normal">{content}</p>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-px border-8 border-transparent border-b-[#0b1c3d]" />
  </div>
);

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
    const topCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry?.[0] || 'N/A';
    const topCategoryPct = topCategoryEntry ? Math.round((topCategoryEntry[1] / total) * 100) : 0;

    // 3. Normalized Temporal Average & Trend
    const dates = data.map(d => new Date(d.date).getTime()).filter(t => !Number.isNaN(t)).sort((a, b) => a - b);
    const minDate = dates.length > 0 ? dates[0] : Date.now();
    const maxDate = dates.length > 0 ? dates[dates.length - 1] : Date.now();
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

    // 5. Quantity Densities
    const totalQuantity = data.reduce((acc, d) => acc + (d.quantity || 0), 0);
    
    // 6. Highest Concentration (Postcode Density Peak)
    const postcodeCounts: Record<string, number> = {};
    data.forEach(d => {
      const pc = d.postcode ? d.postcode.split(' ')[0] : 'Unknown';
      postcodeCounts[pc] = (postcodeCounts[pc] || 0) + 1;
    });
    const topPostcodeEntry = Object.entries(postcodeCounts).sort((a, b) => b[1] - a[1])[0];
    const topPostcode = topPostcodeEntry?.[0] || 'N/A';
    const topPostcodePct = topPostcodeEntry ? Math.round((topPostcodeEntry[1] / total) * 100) : 0;

    // 7. Sparkline generation
    const buckets = 10;
    const bucketSize = diffMs / buckets || 1;
    const counts = new Array(buckets).fill(0);
    dates.forEach(t => {
        const idx = Math.min(buckets - 1, Math.floor((t - minDate) / bucketSize));
        counts[idx]++;
    });
    const maxCount = Math.max(...counts, 1);
    const w = 60;
    const h = 20;
    // Map points smoothly for SVG
    const sparklinePoints = counts.map((c, i) => `${(i / (buckets - 1)) * w},${h - (c / maxCount) * h}`).join(' ');

    return { 
      total, 
      topCategory, 
      topCategoryPct,
      avgValue, 
      avgLabel, 
      topCity, 
      totalQuantity, 
      trend,
      topPostcode,
      topPostcodePct,
      sparklinePoints
    };
  }, [data]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
      {/* 1. Total Seizures with Sparkline & Trend */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-colors duration-300 relative overflow-hidden group">
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <TrendingUp className="text-blue-600" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Seizures</p>
            <div className="flex items-end gap-1.5">
              <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">{stats.total}</p>
              {stats.trend !== 0 && (
                <span className={`text-[9px] font-bold pb-[1px] flex items-center ${stats.trend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {stats.trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(stats.trend)}%
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Micro-chart (Sparkline) */}
        <div className="absolute -bottom-1 -right-1 opacity-20 dark:opacity-30 group-hover:opacity-40 transition-opacity">
          <svg width="60" height="25" viewBox="-5 -5 70 30" preserveAspectRatio="none">
            <polyline 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              className="text-blue-600 dark:text-blue-400 drop-shadow-sm"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={stats.sparklinePoints} 
            />
          </svg>
        </div>
      </div>

      {/* 2. Total Quantity */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors duration-300">
        <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-xl border border-slate-100 dark:border-slate-600">
          <Layers className="text-slate-600 dark:text-slate-300" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Quantity</p>
          <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">{stats.totalQuantity.toLocaleString()}</p>
        </div>
      </div>

      {/* 4. Top Category */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 relative group cursor-help transition-colors duration-300">
        <IntelligenceTooltip 
          title="Primary Class Indicator" 
          content="Represents the commodity class with the highest frequency of seizure events within the current filtered view. The percentage indicates its proportion compared to all other classes." 
        />
        <div className="absolute top-2 right-2 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 hidden xl:block">
          <Info size={12} />
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
          <Package className="text-emerald-600 dark:text-emerald-400" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Primary Class</p>
          <div className="flex items-end gap-1.5 flex-wrap">
            <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight break-all sm:break-normal">{stats.topCategory}</p>
            <span className="text-[9px] font-bold text-slate-400 pb-[1px] whitespace-nowrap">{stats.topCategoryPct}%</span>
          </div>
        </div>
      </div>

      {/* 5. Temporal Average */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center gap-1 relative group cursor-help transition-colors duration-300">
        <IntelligenceTooltip 
          title="Operational Trend" 
          content="Compares seizure frequency in the second half of the selected timeframe against the first half to identify rising or falling activity." 
        />
        <div className="absolute top-2 right-2 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 hidden xl:block">
          <Info size={12} />
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-xl border border-amber-100 dark:border-amber-800/50">
            <Calendar className="text-amber-600 dark:text-amber-400" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{stats.avgLabel}</p>
            <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">{stats.avgValue}</p>
          </div>
        </div>
      </div>

      {/* 6. Weighted Hub (City) */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 relative group cursor-help transition-colors duration-300">
        <IntelligenceTooltip 
          title="Weighted Hub Logic" 
          content="Cities are ranked by the total volume (quantity) of items seized, ensuring large-scale shipments take precedence over high-frequency small incidents." 
        />
        <div className="absolute top-2 right-2 text-slate-300 dark:text-slate-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 hidden xl:block">
          <Info size={12} />
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/30 p-2 rounded-xl border border-violet-100 dark:border-violet-800/50">
          <MapPin className="text-violet-600 dark:text-violet-400" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Weighted Hub</p>
          <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">{stats.topCity}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;
