
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { SeizureRecord } from '../types';

interface TopTenChartProps {
  data: SeizureRecord[];
  type: 'city' | 'item' | 'category';
  chartType?: 'bar' | 'pie';
}

// A reusable chart component for "Top 10" summaries.
// It can render as a horizontal bar chart or a pie chart.
const TopTenChart: React.FC<TopTenChartProps> = ({ data, type, chartType = 'bar' }) => {
  // We compute the top 10 rankings on the fly based on the currently filtered data.
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      // We map the 'type' prop to the actual data field.
      const key = d[type === 'city' ? 'city' : type === 'category' ? 'category' : 'item'] || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });

    // Sort descending and take the top 10.
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, type]);

  // A professional and distinct color palette for the charts.
  const colors = [
    '#1e3a8a', // Deep Blue
    '#059669', // Emerald
    '#4f46e5', // Indigo
    '#d97706', // Amber
    '#e11d48', // Rose
    '#0891b2', // Cyan
    '#7c3aed', // Violet
    '#475569', // Slate
    '#ea580c', // Orange
    '#0d9488'  // Teal
  ];

  if (chartData.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400">No data available for top chart.</div>;
  }

  return (
    <div className="h-full w-full">
      <h3 className="text-[10px] font-black mb-4 uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Top 10 by {type}</h3>
      <ResponsiveContainer width="100%" height="85%">
        {chartType === 'bar' ? (
          <BarChart layout="vertical" data={chartData} margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }} 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
            />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle" 
              iconType="circle" 
              wrapperStyle={{ 
                fontSize: '8px', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                paddingLeft: '10px',
                lineHeight: '1.5'
              }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default TopTenChart;
