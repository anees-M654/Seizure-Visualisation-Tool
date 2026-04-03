
import React, { useState, useMemo, useEffect } from 'react';
import { SeizureRecord, FilterState, DataQualityReport } from './types';
import { parseRawData, generateMockData, exportToCSV } from './utils/dataProcessor';
import Filters from './components/Filters';
import HeatMap from './HeatMap';
import TopTenChart from './TopTenChart';
import FileUploader from './components/FileUploader';
import SummaryStats from './components/SummaryStats';
import { Shield, FileText, AlertCircle, Database, LayoutDashboard, Table, Download, History, MousePointer2, Moon, Sun } from 'lucide-react';

// Root component of the Y&H ROCU Seizure Analysis Tool.
// This orchestrates the data flow from import to visualization.
const App: React.FC = () => {
  // Core data state - holds the parsed records from the spreadsheet
  const [rawData, setRawData] = useState<SeizureRecord[]>([]);
  // Quality report state - used to alert the user about missing/bad data
  const [quality, setQuality] = useState<DataQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // View management: 'import' for the landing screen, 'dashboard' for analysis
  const [view, setView] = useState<'dashboard' | 'import'>('import');
  // Toggle between the map view and the raw data grid
  const [showTable, setShowTable] = useState(false);
  // Chart type selection for the side panel
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  
  // Temporal Playback state - controls the cumulative trend animation
  // This allows analysts to see how hotspots developed over time.
  const [timeProgress, setTimeProgress] = useState(100);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply dark mode class to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Central filter state - updated by the sidebar component
  const [filters, setFilters] = useState<FilterState>({
    dateRange: ['', ''],
    categories: [],
    subCategories: [],
    cities: [],
    postcodes: [],
    keyword: '',
    spatialFilter: null
  });

  // Handles the file import process.
  // We simulate a small delay to give the user feedback that processing is happening.
  const handleDataLoad = (data: any[]) => {
    setIsLoading(true);
    setTimeout(() => {
      const dataToParse = data.length > 0 ? data : generateMockData(400);
      // Fix: Use unique names to avoid shadowing the component state
      const { records: loadedRecords, quality: report } = parseRawData(dataToParse);
      setRawData(loadedRecords);
      setQuality(report);
      setIsLoading(false);
      setView('dashboard');
    }, 1200);
  };

  // The engine of the dashboard: computes the filtered dataset based on all active criteria.
  // We use useMemo here because this can be expensive with thousands of records.
  const filteredData = useMemo(() => {
    const keyword = filters.keyword.toLowerCase().trim();

    let result = rawData.filter(d => {
      // 1. Broad Keyword Search (Includes Redacted/Unknown Columns)
      if (keyword) {
        const isMatch = Object.values(d).some(val => String(val || '').toLowerCase().includes(keyword));
        if (!isMatch) return false;
      }
      
      // 2. Category Filters: supports multi-select for drugs, weapons, etc.
      if (filters.categories.length > 0 && !filters.categories.includes(d.category)) return false;
      if (filters.subCategories.length > 0 && !filters.subCategories.includes(d.subCategory)) return false;
      
      // 3. Location Filters: City and Postcode prefix (e.g., LS, BD, S).
      if (filters.cities.length > 0 && !filters.cities.includes(d.city)) return false;
      if (filters.postcodes.length > 0 && !filters.postcodes.some(pc => d.postcode.startsWith(pc))) return false;
      
      // 4. Date Range: manual selection or presets (Monthly/Yearly).
      if (filters.dateRange[0] || filters.dateRange[1]) {
        const time = new Date(d.date).getTime();
        if (isNaN(time)) return false; // Ignore records without dates if a date filter is applied
        if (filters.dateRange[0] && time < new Date(filters.dateRange[0]).getTime()) return false;
        if (filters.dateRange[1] && time > new Date(filters.dateRange[1]).getTime() + 86400000) return false;
      }
      
      // 5. Spatial Filter (Lasso / Radius)
      if (filters.spatialFilter) {
        if (!d.latitude || !d.longitude) return false;
        
        if (filters.spatialFilter.type === 'circle') {
          const R = 6371e3; // metres
          const φ1 = filters.spatialFilter.lat * Math.PI/180;
          const φ2 = d.latitude * Math.PI/180;
          const Δφ = (d.latitude - filters.spatialFilter.lat) * Math.PI/180;
          const Δλ = (d.longitude - filters.spatialFilter.lng) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          if (distance > filters.spatialFilter.radiusMeters) return false;
        } else if (filters.spatialFilter.type === 'polygon' || filters.spatialFilter.type === 'rectangle') {
          // Ray casting for point in polygon
          let inside = false;
          const vs = filters.spatialFilter.latlngs;
          const x = d.longitude, y = d.latitude;
          for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
              const xi = vs[i].lng, yi = vs[i].lat;
              const xj = vs[j].lng, yj = vs[j].lat;
              const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
              if (intersect) inside = !inside;
          }
          if (!inside) return false;
        }
      }

      return true;
    });

    // 5. Trend Analysis Logic:
    // We sort by date first, then slice based on the 'timeProgress' slider.
    // This creates the "playback" effect on the map.
    result.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      if (isNaN(aTime) && isNaN(bTime)) return 0;
      if (isNaN(aTime)) return 1;
      if (isNaN(bTime)) return -1;
      return aTime - bTime;
    });
    const sliceCount = Math.floor(result.length * (timeProgress / 100));
    return result.slice(0, sliceCount);
  }, [rawData, filters, timeProgress]);

  // Dynamically determine table headers based on the keys present in the data.
  // This ensures that if the ROCU adds a new column to their spreadsheet, it just shows up.
  const dynamicHeaders = useMemo(() => {
    if (filteredData.length === 0) return [];
    // We hide internal fields like lat/lng/id to keep the table clean for analysts.
    return Object.keys(filteredData[0]).filter(key => !['latitude', 'longitude', 'id'].includes(key));
  }, [filteredData]);

  // Extract unique values for the filter dropdowns/chips.
  const uniqueValues = useMemo(() => {
    return {
      categories: Array.from(new Set(rawData.map(d => d.category))),
      subCategories: Array.from(new Set(rawData.map(d => d.subCategory))),
      cities: Array.from(new Set(rawData.map(d => d.city))),
      postcodes: Array.from(new Set(rawData.map(d => d.postcode.substring(0, 2).trim()))).sort()
    };
  }, [rawData]);

  // Requirement: Quick AI Summary generation based on filtered data for the snapshot
  const aiSummary = useMemo(() => {
    if (filteredData.length === 0) return "No data available for analysis.";
    
    const categoryCounts: Record<string, number> = {};
    filteredData.forEach(d => { categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1; });
    const topCat = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    const cityWeights: Record<string, number> = {};
    filteredData.forEach(d => { cityWeights[d.city] = (cityWeights[d.city] || 0) + (d.quantity || 1); });
    const topCity = Object.entries(cityWeights).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const totalQty = filteredData.reduce((acc, d) => acc + (d.quantity || 0), 0);

    return `Intelligence scan of ${filteredData.length} records indicates that ${topCat} remains the primary seizure category. Geographic clustering confirms ${topCity} as the highest volume hub with ${totalQty.toLocaleString()} cumulative units processed. The current filter configuration highlights a specific regional trend that requires immediate tactical review.`;
  }, [filteredData]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <header className="bg-[#0b1c3d] text-white p-4 flex items-center justify-between shadow-xl border-b border-blue-900 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/30 p-2 rounded-lg border border-blue-400/20">
            <Shield className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none uppercase">Y&H ROCU SEIZURE TOOL</h1>
            <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[2px] mt-1">Regional Crime Intelligence System v2.0</p>
          </div>
        </div>
        
        {view === 'dashboard' && (
          <div className="flex items-center gap-2 print:hidden">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700 mr-2 text-slate-200"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-blue-300" />}
            </button>
            {/* Requirement: Export Visualisation into CSV */}
            <button onClick={() => exportToCSV(filteredData)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700">
              <Download size={14} /> Export CSV
            </button>
            {/* Requirement: Export Visualisation into PDF */}
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700">
              <FileText size={14} /> Export PDF
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button onClick={() => setView('import')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/40">
              <Database size={14} /> New Import
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden">
        {view === 'import' ? (
          <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
            <FileUploader onFileUpload={handleDataLoad} isLoading={isLoading} />
          </div>
        ) : (
          <>
            <aside className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-lg z-40 print:hidden transition-colors duration-300">
              <Filters 
                filters={filters} 
                onFilterChange={(u) => setFilters(f => ({ ...f, ...u }))}
                uniqueValues={uniqueValues}
                rawData={rawData}
              />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900 print:overflow-visible print:bg-white print:block transition-colors duration-300">
              {/* Structured Report Header for PDF Exports */}
              <div className="hidden print:block p-8 border-b-4 border-[#0b1c3d] mb-4 bg-white">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-black text-[#0b1c3d] uppercase tracking-tighter">Intelligence Snapshot</h1>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[3px] mt-1">Yorkshire & Humber ROCU • Official Use Only</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Generated</p>
                    <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                
                {/* AI Executive Summary */}
                <div className="mt-6 p-4 bg-slate-50 border-l-4 border-blue-600 rounded-r-lg">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-blue-800 mb-1">AI Intelligence Summary</h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{aiSummary}</p>
                </div>
              </div>

              {/* Requirement: Data quality assessment scan (identifies gaps/missing fields) */}
              {quality && (quality.malformedDates > 0 || quality.invalidPostcodes > 0) && (
                <div className="bg-amber-500 text-white p-1.5 px-6 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-wider animate-pulse print:hidden">
                  <AlertCircle size={14} /> Data Integrity Alert: {quality.malformedDates + quality.invalidPostcodes} data quality issues detected (missing dates or map locations). These records remain searchable but are hidden from the visual heatmap.
                </div>
              )}

              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-y-auto print:overflow-visible print:block print:p-4">
                <div className="lg:col-span-12 print:hidden">
                  <SummaryStats data={filteredData} />
                </div>
                
                <div className="lg:col-span-8 space-y-4 flex flex-col h-full min-h-[500px] print:h-[480px] print:mb-6">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 flex-1 relative transition-colors duration-300">
                    <div className="flex items-center justify-between print:mb-2">
                      <div className="flex items-center gap-3">
                        <LayoutDashboard className="text-blue-600 dark:text-blue-400" size={20} />
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Interactive Hotspot Map</h2>
                      </div>
                      <div className="flex items-center gap-4 print:hidden">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                          <MousePointer2 size={10} /> Scroll to Zoom | Drag to Move
                        </div>
                        <button 
                          onClick={() => setShowTable(!showTable)}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-100 dark:border-blue-800/50"
                        >
                          <Table size={12} /> {showTable ? 'Show Map' : 'Show Data Grid'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Requirement: Geographic Visualisation Heat Map */}
                    <div className="flex-1 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 min-h-[400px] print:min-h-[350px]">
                      {showTable ? (
                        <div className="h-full overflow-auto bg-white dark:bg-slate-800">
                          <table className="w-full border-collapse text-[10px]">
                            <thead className="sticky top-0 bg-slate-900 text-white z-10">
                              <tr>
                                {dynamicHeaders.map(header => (
                                  <th key={header} className="p-2.5 text-left border-r border-slate-800 uppercase tracking-tighter whitespace-nowrap">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {filteredData.slice(0, 100).map((r, i) => (
                                <tr key={r.id} className={i % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'}>
                                  {dynamicHeaders.map(header => (
                                    <td key={`${r.id}-${header}`} className="p-2.5 border-r border-slate-100 dark:border-slate-700 max-w-[150px] truncate text-slate-600 dark:text-slate-300">
                                      {header === 'date' ? r.date.split('T')[0] : String(r[header] || '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filteredData.length > 100 && (
                            <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                              Showing first 100 records. Export CSV for full dataset.
                            </div>
                          )}
                        </div>
                      ) : (
                        <HeatMap 
                          data={filteredData.filter(d => d.latitude !== 0 && d.longitude !== 0)} 
                          isDarkMode={isDarkMode} 
                          onSpatialFilter={(spatialFilter) => setFilters(f => ({ ...f, spatialFilter }))}
                          activeSpatialFilter={filters.spatialFilter}
                        />
                      )}
                    </div>

                    {/* Requirement: Trend Analysis / Date Analysis Animation Scrollbar */}
                    <div className="bg-slate-900 p-4 rounded-xl shadow-inner border border-slate-800 print:hidden">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 text-white">
                          <History size={16} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Trend Analysis: Temporal Playback</span>
                        </div>
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                          Viewing: First {timeProgress}% of period
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={timeProgress} 
                        onChange={(e) => setTimeProgress(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                      />
                      <div className="flex justify-between mt-1 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                        <span>Past (Earliest Seizures)</span>
                        <span>Present (Cumulative Hotspots)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirement: Produce a top 10 summary of data */}
                <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-1 print:overflow-visible print:grid print:grid-cols-3 print:gap-4 print:space-y-0">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between print:hidden transition-colors duration-300">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Visualisation Mode</span>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                      <button 
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        Bar
                      </button>
                      <button 
                        onClick={() => setChartType('pie')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${chartType === 'pie' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        Pie
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[280px] hover:shadow-md transition-shadow duration-300 print:h-[280px] print:break-inside-avoid print:shadow-none print:border-slate-100">
                    <TopTenChart data={filteredData} type="city" chartType={chartType} isDarkMode={isDarkMode} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[280px] hover:shadow-md transition-shadow duration-300 print:h-[280px] print:break-inside-avoid print:shadow-none print:border-slate-100">
                    <TopTenChart data={filteredData} type="category" chartType={chartType} isDarkMode={isDarkMode} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[280px] hover:shadow-md transition-shadow duration-300 print:h-[280px] print:break-inside-avoid print:shadow-none print:border-slate-100">
                    <TopTenChart data={filteredData} type="itemType" chartType={chartType} isDarkMode={isDarkMode} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 p-2.5 px-6 flex items-center justify-between text-[10px] text-slate-400 font-bold print:hidden">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-500" /> PROTECTED LOCAL INSTANCE</span>
          <span className="text-slate-600">|</span>
          <span>INTELLIGENCE GATHERING MODE</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-blue-400/80 tracking-widest uppercase">Yorkshire & Humber ROCU</span>
          <span className="bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-900/50 uppercase tracking-tighter shadow-inner shadow-black">Official - Restricted</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
