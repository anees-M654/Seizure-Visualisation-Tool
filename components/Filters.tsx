
import React, { useState, useMemo } from 'react';
import { FilterState, SeizureRecord } from '../types';
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
  rawData?: SeizureRecord[];
}

// This component manages the sidebar filter logic.
// It uses a "controlled component" pattern, receiving current filters as props and 
// notifying the parent (App.tsx) when a change occurs.
const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange, uniqueValues, rawData = [] }) => {
  const [citySearch, setCitySearch] = useState('');
  const [postcodeSearch, setPostcodeSearch] = useState('');

  const activePills = useMemo(() => {
    const pills: { label: string; remove: () => void }[] = [];
    if (filters.keyword) {
      pills.push({ label: `"${filters.keyword}"`, remove: () => onFilterChange({ keyword: '' }) });
    }
    filters.categories.forEach(c => pills.push({ label: c, remove: () => onFilterChange({ categories: filters.categories.filter(x => x !== c) }) }));
    filters.subCategories.forEach(c => pills.push({ label: c, remove: () => onFilterChange({ subCategories: filters.subCategories.filter(x => x !== c) }) }));
    filters.cities.forEach(c => pills.push({ label: c, remove: () => onFilterChange({ cities: filters.cities.filter(x => x !== c) }) }));
    filters.postcodes.forEach(c => pills.push({ label: c, remove: () => onFilterChange({ postcodes: filters.postcodes.filter(x => x !== c) }) }));
    return pills;
  }, [filters, onFilterChange]);

  const histogramData = useMemo(() => {
    if (!rawData.length) return [];
    const times = rawData.map(d => new Date(d.date).getTime()).filter(t => Number.isFinite(t));
    if (times.length === 0) return [];
    
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times) + 1;
    if (minTime >= maxTime) return [];
    
    const bins = 40;
    const binSize = (maxTime - minTime) / bins;
    const counts = new Array(bins).fill(0);
    
    times.forEach(t => {
        const idx = Math.floor((t - minTime) / binSize);
        if (idx >= 0 && idx < bins) counts[idx]++;
    });
    
    const maxCount = Math.max(...counts, 1);
    return counts.map((count, i) => ({
        count,
        normalized: count / maxCount,
        startTime: minTime + i * binSize
    }));
  }, [rawData]);

  // Helper to set date ranges based on common presets.
  const setDatePreset = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    onFilterChange({ dateRange: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] });
  };

  return (
    <div className="space-y-6 p-4 bg-white dark:bg-slate-800 h-full border-r border-slate-200 dark:border-slate-800 overflow-y-auto transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Search size={20} className="text-blue-600 dark:text-blue-400" /> Filter Analysis
        </h2>
      </div>

      {/* Active Filter Pills */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          {activePills.map((pill, i) => (
            <button
              key={`${pill.label}-${i}`}
              onClick={pill.remove}
              className="flex items-center gap-1 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 hover:border-red-200 dark:hover:border-red-800 transition-colors"
            >
              {pill.label} <X size={10} />
            </button>
          ))}
        </div>
      )}

      {/* Global Keyword Search */}
      <div className="space-y-2">
        <label htmlFor="keyword-search" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Search</label>
        <div className="relative">
          <input
            id="keyword-search"
            type="text"
            placeholder="Search keywords..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-300"
            value={filters.keyword}
            onChange={(e) => onFilterChange({ keyword: e.target.value })}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
        </div>
      </div>

      {/* Date Range & Presets */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <Calendar size={14} /> Date Period
        </label>
        
        {/* Histogram Visualisation */}
        {histogramData.length > 0 && (
          <div className="relative h-10 w-full mb-1 flex items-end justify-between gap-[1px]">
            {histogramData.map((bin, i) => {
              let isInRange = true;
              if (filters.dateRange[0]) {
                  const startFilter = new Date(filters.dateRange[0]).getTime();
                  if (bin.startTime < startFilter) isInRange = false;
              }
              if (filters.dateRange[1]) {
                  const endFilter = new Date(filters.dateRange[1]).getTime() + 86400000;
                  if (bin.startTime > endFilter) isInRange = false;
              }
              
              return (
                <div 
                  key={`bin-${i}`} 
                  className={`w-full rounded-t-[1px] transition-all duration-300 ${isInRange ? 'bg-blue-500 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  style={{ height: `${Math.max(5, bin.normalized * 100)}%` }}
                  title={`${bin.count} items`}
                />
              )
            })}
          </div>
        )}

        <div className="flex gap-1">
          <button onClick={() => setDatePreset(1)} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 flex-1 transition-colors">Monthly</button>
          <button onClick={() => setDatePreset(3)} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 flex-1 transition-colors">Quarterly</button>
          <button onClick={() => setDatePreset(12)} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 flex-1 transition-colors">Yearly</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className="text-[11px] p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md w-full text-slate-900 dark:text-slate-100 font-medium transition-colors"
            style={{ colorScheme: 'auto' }}
            value={filters.dateRange[0]}
            onChange={(e) => onFilterChange({ dateRange: [e.target.value, filters.dateRange[1]] })}
          />
          <input
            type="date"
            className="text-[11px] p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md w-full text-slate-900 dark:text-slate-100 font-medium transition-colors"
            style={{ colorScheme: 'auto' }}
            value={filters.dateRange[1]}
            onChange={(e) => onFilterChange({ dateRange: [filters.dateRange[0], e.target.value] })}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
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
                filters.categories.includes(cat) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
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
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sub-Categories</label>
          <div className="flex flex-wrap gap-1.5">
            {uniqueValues.subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => {
                  const newSubs = filters.subCategories.includes(sub) ? filters.subCategories.filter(s => s !== sub) : [...filters.subCategories, sub];
                  onFilterChange({ subCategories: newSubs });
                }}
                className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                  filters.subCategories.includes(sub) ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
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
        <label htmlFor="city-search" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <MapPin size={14} /> City Filter
        </label>
        <div className="relative pt-1 pb-1">
          <input
            id="city-search"
            type="text"
            placeholder="Search city..."
            className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
          />
          <Search className="absolute left-2.5 top-[10px] text-slate-400 transform translate-y-1/2 mt-[-6px]" size={12} />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          {uniqueValues.cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(city => (
            <button
              key={city}
              onClick={() => {
                const newCities = filters.cities.includes(city) ? filters.cities.filter(c => c !== city) : [...filters.cities, city];
                onFilterChange({ cities: newCities });
              }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                filters.cities.includes(city) ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Postcode Prefix Selection */}
      <div className="space-y-2">
        <label htmlFor="postcode-search" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Postcode Regions</label>
        <div className="relative pt-1 pb-1">
          <input
            id="postcode-search"
            type="text"
            placeholder="Search postcode..."
            className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            value={postcodeSearch}
            onChange={(e) => setPostcodeSearch(e.target.value)}
          />
          <Search className="absolute left-2.5 top-[10px] text-slate-400 transform translate-y-1/2 mt-[-6px]" size={12} />
        </div>
        <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto pr-1">
          {uniqueValues.postcodes.filter(pc => pc.toLowerCase().includes(postcodeSearch.toLowerCase())).map(pc => (
            <button
              key={pc}
              onClick={() => {
                const newPc = filters.postcodes.includes(pc) ? filters.postcodes.filter(p => p !== pc) : [...filters.postcodes, pc];
                onFilterChange({ postcodes: newPc });
              }}
              className={`text-[10px] p-1 border text-center rounded transition-all ${
                filters.postcodes.includes(pc) ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              {pc}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => onFilterChange({ dateRange: ['', ''], categories: [], subCategories: [], cities: [], postcodes: [], keyword: '' })}
        className="w-full py-2 mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center gap-1 transition-colors border border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-red-200 dark:hover:border-red-900"
      >
        <X size={14} /> Clear All Filters
      </button>
    </div>
  );
};

export default Filters;
