import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { SeizureRecord } from './types';

interface TopTenChartProps {
  data: SeizureRecord[];
  type: 'city' | 'category' | 'itemType';
  chartType: 'bar' | 'pie';
  isDarkMode: boolean;
}

const TopTenChart: React.FC<TopTenChartProps> = ({ data, type, chartType, isDarkMode }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      const key = d[type] || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, type]);

  const totalCount = useMemo(() => data.length, [data]);

  // High-contrast Intelligence Palette: Moves from deep navy to vibrant teal to maintain readability
  const COLORS = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#0ea5e9', '#06b6d4', '#0891b2', '#0d9488', '#14b8a6'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const percentage = ((val / totalCount) * 100).toFixed(1);
      return (
        <div className="bg-[#0b1c3d] text-white p-3 rounded-xl shadow-2xl border border-blue-900/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{payload[0].payload.name}</p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{val}</span>
            <span className="text-[10px] font-bold bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
              {percentage}% of Total
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const titleMap = {
    city: "Top Seizure Locations",
    category: "Classification Distribution",
    itemType: "Primary Items Seized"
  };

  if (chartData.length === 0) return (
    <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
      No Data for Visualization
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{titleMap[type]}</h3>
        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Top 10 Focus</span>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                fontSize={9}
                fontWeight={700}
                tick={{ fill: isDarkMode ? '#cbd5e1' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopTenChart;