import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LabelList } from 'recharts';
import { SeizureRecord } from './types';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const val = payload[0].value;
    
    return (
      <div className="bg-slate-900 text-white px-3 py-1.5 rounded shadow-xl border border-blue-500/50 flex items-center gap-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">{data.name}</p>
        <div className="w-px h-3 bg-white/20" />
        <p className="text-[9px] font-black tabular-nums whitespace-nowrap">{val.toLocaleString()} UNITS</p>
      </div>
    );
  }
  return null;
};

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

  // Navy-to-Teal Gradient Palette: Matches user reference images
  const COLORS = [
    '#1e3a8a', // Deep Navy
    '#2563eb', // Strong Blue
    '#3b82f6', // Royal Blue
    '#60a5fa', // Light Blue
    '#38bdf8', // Sky Blue
    '#06b6d4', // Bright Cyan
    '#0891b2', // Deep Cyan
    '#0d9488', // Dark Teal
    '#10b981', // Emerald
    '#14b8a6'  // Vibrant Turquoise
  ];

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
      </div>

      <div className="flex-1 print:h-[250px] print:min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
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
              <Tooltip 
                content={<CustomTooltip totalCount={totalCount} isDarkMode={isDarkMode} />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart margin={{ top: 40, bottom: 40, left: 45, right: 45 }}>
              <Tooltip 
                content={<CustomTooltip totalCount={totalCount} isDarkMode={isDarkMode} />}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={68}
                paddingAngle={0}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                  const RADIAN = Math.PI / 180;
                  const innerLabelRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const ix = cx + innerLabelRadius * Math.cos(-midAngle * RADIAN);
                  const iy = cy + innerLabelRadius * Math.sin(-midAngle * RADIAN);
                  const outerLabelRadius = outerRadius + 18;
                  const ox = cx + outerLabelRadius * Math.cos(-midAngle * RADIAN);
                  const oy = cy + outerLabelRadius * Math.sin(-midAngle * RADIAN);
                  const p = ((value / totalCount) * 100).toFixed(0);
                  
                  return (
                    <g>
                      <text 
                        x={ix} 
                        y={iy} 
                        fill="white" 
                        textAnchor="middle" 
                        dominantBaseline="central"
                        className="text-[9px] font-black"
                      >
                        {p}%
                      </text>
                      <text 
                        x={ox} 
                        y={oy} 
                        fill={isDarkMode ? '#cbd5e1' : '#475569'} 
                        textAnchor={ox > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        className="text-[9px] italic font-medium tracking-tight"
                      >
                        {name}
                      </text>
                    </g>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${entry.name}-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="none"
                  />
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