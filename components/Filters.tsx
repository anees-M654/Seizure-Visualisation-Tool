
import React from 'react';
import { FilterState } from '../types';
import { Search, Calendar, MapPin, Tag, X } from 'lucide-react';

interface FiltersProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  uniqueValues: {
    categories: string[];
    subCategories: string[];
    cities: string[];
    postcodes: string[];
  };
}

// This component manages the sidebar filter logic.
// It uses a "controlled component" pattern, receiving current filters as props and 
// notifying the parent (App.tsx) when a change occurs.
const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange, uniqueValues }) => {
  // Helper to set date ranges based on common presets.
  const setDatePreset = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    onFilterChange({ dateRange: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] });
  };

  return (
    <div className="space-y-6 p-4 bg-white h-full border-r border-slate-200 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Search size={20} className="text-blue-600" /> Filter Analysis
        </h2>
      </div>

      {/* Global Keyword Search */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Search</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search keywords..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filters.keyword}
            onChange={(e) => onFilterChange({ keyword: e.target.value })}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        </div>
      </div>

      {/* Date Range & Presets */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Calendar size={14} /> Date Period
        </label>
        <div className="flex gap-1">
          <button onClick={() => setDatePreset(1)} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex-1 transition-colors">Monthly</button>
          <button onClick={() => setDatePreset(3)} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex-1 transition-colors">Quarterly</button>
          <button onClick={() => setDatePreset(12)} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex-1 transition-colors">Yearly</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className="text-[11px] p-2 bg-white border border-slate-300 rounded-md w-full text-slate-900 font-medium"
            style={{ colorScheme: 'light' }}
            value={filters.dateRange[0]}
            onChange={(e) => onFilterChange({ dateRange: [e.target.value, filters.dateRange[1]] })}
          />
          <input
            type="date"
            className="text-[11px] p-2 bg-white border border-slate-300 rounded-md w-full text-slate-900 font-medium"
            style={{ colorScheme: 'light' }}
            value={filters.dateRange[1]}
            onChange={(e) => onFilterChange({ dateRange: [filters.dateRange[0], e.target.value] })}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Tag size={14} /> Categories
        </label>
        <div className="flex flex-wrap gap-1.5">
          {uniqueValues.categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                const newCats = filters.categories.includes(cat) ? filters.categories.filter(c => c !== cat) : [...filters.categories, cat];
                onFilterChange({ categories: newCats });
              }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                filters.categories.includes(cat) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Category Filter */}
      {filters.categories.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-Categories</label>
          <div className="flex flex-wrap gap-1.5">
            {uniqueValues.subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => {
                  const newSubs = filters.subCategories.includes(sub) ? filters.subCategories.filter(s => s !== sub) : [...filters.subCategories, sub];
                  onFilterChange({ subCategories: newSubs });
                }}
                className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                  filters.subCategories.includes(sub) ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-indigo-300'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City Filter */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <MapPin size={14} /> City Filter
        </label>
        <div className="flex flex-wrap gap-1.5">
          {uniqueValues.cities.map(city => (
            <button
              key={city}
              onClick={() => {
                const newCities = filters.cities.includes(city) ? filters.cities.filter(c => c !== city) : [...filters.cities, city];
                onFilterChange({ cities: newCities });
              }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                filters.cities.includes(city) ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Postcode Prefix Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Postcode Regions</label>
        <div className="grid grid-cols-4 gap-1">
          {uniqueValues.postcodes.map(pc => (
            <button
              key={pc}
              onClick={() => {
                const newPc = filters.postcodes.includes(pc) ? filters.postcodes.filter(p => p !== pc) : [...filters.postcodes, pc];
                onFilterChange({ postcodes: newPc });
              }}
              className={`text-[10px] p-1 border text-center rounded transition-all ${
                filters.postcodes.includes(pc) ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
              }`}
            >
              {pc}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => onFilterChange({ dateRange: ['', ''], categories: [], subCategories: [], cities: [], postcodes: [], keyword: '' })}
        className="w-full py-2 mt-4 text-xs font-bold text-slate-400 hover:text-red-500 flex items-center justify-center gap-1 transition-colors border border-dashed border-slate-200 rounded-lg hover:border-red-200"
      >
        <X size={14} /> Clear All Filters
      </button>
    </div>
  );
};

export default Filters;
