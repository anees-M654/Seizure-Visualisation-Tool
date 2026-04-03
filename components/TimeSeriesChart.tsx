import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SeizureRecord } from '../types';

interface TimeSeriesChartProps {
  data: SeizureRecord[];
  isDarkMode: boolean;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, isDarkMode }) => {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    
    // Determine bounds to decide binning strategy (days vs months)
    const validDates = data.map(d => new Date(d.date).getTime()).filter(t => !isNaN(t)).sort();
    if (validDates.length === 0) return [];
    
    const minDate = validDates[0];
    const maxDate = validDates[validDates.length - 1];
    const spanDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    
    const isMonthly = spanDays > 90; // Over 3 months, use monthly bins
    
    const counts: Record<string, number> = {};
    
    data.forEach(d => {
      const ms = new Date(d.date).getTime();
      if (isNaN(ms)) return;
      const dateStr = new Date(ms).toISOString();
      let key = dateStr.split('T')[0]; // YYYY-MM-DD
      
      if (isMonthly) {
        key = dateStr.slice(0, 7); // YYYY-MM
      }
      counts[key] = (counts[key] || 0) + (d.quantity || 1);
    });

    const parsedData = Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
      
    // Format keys for display
    return parsedData.map(d => {
      let displayDate = d.date;
      if (isMonthly) {
        const [yr, mo] = d.date.split('-');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        displayDate = `${monthNames[parseInt(mo) - 1]} '${yr.slice(2)}`;
      }
      return { ...d, displayDate };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b1c3d] text-white p-3 rounded-xl shadow-2xl border border-blue-900/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{payload[0].payload.displayDate || label}</p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{payload[0].value} <span className="text-[10px] text-blue-300/60 uppercase tracking-widest font-bold">Units Collected</span></span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) return (
    <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
      No Temporal Data
    </div>
  );

  return (
    <div className="h-full flex flex-col justify-end w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Temporal Seizure Trend</h3>
        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Chronological Volume</span>
      </div>

      <div className="flex-1 w-full min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 9, fill: isDarkMode ? '#cbd5e1' : '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(59, 130, 246, 0.4)', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorCount)" 
              activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;
