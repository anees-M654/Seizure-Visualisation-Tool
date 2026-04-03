
import React, { useEffect, useRef, useState } from 'react';
import { SeizureRecord } from '../types';
import { Target } from 'lucide-react';

interface HeatMapProps {
  data: SeizureRecord[];
}

// This component handles the Leaflet map and the heatmap layer.
// We use the global 'L' object which is loaded via CDN in index.html.
declare const L: any;

const HeatMap: React.FC<HeatMapProps> = ({ data }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const [radius, setRadius] = useState(35);

  // Requirement: Seamlessly adapt map size when sidebar toggles or window resizes.
  // We use a ResizeObserver to trigger Leaflet's internal layout engine.
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: true });
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize the map instance if it doesn't exist yet.
    if (!mapRef.current) {
      // Centering on Leeds/Yorkshire area by default.
      mapRef.current = L.map(mapContainerRef.current).setView([53.79, -1.54], 8);

      // Inject custom CSS to strip Leaflet's default popup styling for the intelligence snapshot
      const styleId = 'leaflet-popup-cleaner';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .intelligence-snapshot-popup .leaflet-popup-content-wrapper {
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .intelligence-snapshot-popup .leaflet-popup-content { margin: 0 !important; }
          .intelligence-snapshot-popup .leaflet-popup-tip-container { display: none !important; }
        `;
        document.head.appendChild(style);
      }
      
      // Standard OpenStreetMap tiles - no API key required for this.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Store initial view for reset button
      mapRef.current.initialView = {
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom()
      };
    }

    // Cleanup existing layers before re-rendering
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    mapRef.current.off('click');

    if (data.length === 0) return;

    // Helper to generate popup content for area intelligence
    const generatePopupContent = (records: SeizureRecord[]): string => {
      const summary = records.slice(0, 15).map(r =>
        `<div class="mb-2 pb-2 border-b border-blue-800/40 last:border-0 last:mb-0 last:pb-0">
          <p class="font-black text-blue-300 uppercase" style="font-size: 9px; letter-spacing: 0.05em;">${r.category} > ${r.subCategory}</p>
          <p class="text-white font-medium" style="font-size: 10px;">${r.itemType} (${r.quantity} units)</p>
          <p class="text-blue-100/60 italic" style="font-size: 8px;">${r.date.split('T')[0]} - ${r.city} (${r.postcode})</p>
          <a href="https://www.google.com/maps?q=&layer=c&cbll=${r.latitude},${r.longitude}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="text-blue-400 hover:text-blue-300 underline font-black inline-block mt-1 uppercase" 
             style="font-size: 8px;">
             VIEW STREET VIEW
          </a>
        </div>`
      ).join('');

      return `
        <div class="p-3 bg-[#0b1c3d] text-white rounded-xl shadow-2xl border border-blue-900/50 font-sans" style="width: 240px;">
          <h4 class="font-black text-[10px] uppercase tracking-widest text-blue-400 mb-3 border-b border-blue-800/50 pb-2">Area Intelligence (${records.length} records)</h4>
          <div style="max-height: 220px; overflow-y: auto; padding-right: 8px; scrollbar-width: thin; scrollbar-color: #1e40af #0b1c3d;">
            ${summary}
          </div>
          ${records.length > 15 ? `<p class="text-[8px] font-black text-blue-400/60 text-center mt-3 pt-2 border-t border-blue-800/50 uppercase tracking-tighter">+ ${records.length - 15} additional records in this cluster</p>` : ''}
        </div>
      `;
    };

    // 2. Prepare and Render Heatmap Layer
    const heatPoints = data.map(d => [d.latitude, d.longitude, (d.quantity || 1) * 0.2]);

    // Create the heat layer with a custom gradient: Blue (low) -> Lime -> Red (high).
    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: radius,
      blur: 15,
      maxZoom: 18, // Allow higher zoom for more detail
      minOpacity: 0.5,
      gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
    }).addTo(mapRef.current);

    // 3. Interactive "Area Intelligence" for Heatmap
    mapRef.current.on('click', (e: any) => {
      const clickLatLng = e.latlng;
      
      // Requirement: Regular Area Intelligence - find records within 2km of click
      const nearbyRecords = data.filter(d => {
        const dist = clickLatLng.distanceTo(L.latLng(d.latitude, d.longitude));
        return dist < 2000; // 2km radius
      });

      if (nearbyRecords.length > 0) {
        // Implementation: Tactical Transport - Automatically zoom and center on the cluster.
        // We calculate the geographic extent of the local records and "fly" to them.
        const clusterBounds = L.latLngBounds(nearbyRecords.map(r => [r.latitude, r.longitude]));
        mapRef.current.flyToBounds(clusterBounds, { 
          padding: [50, 50], 
          maxZoom: 16, 
          duration: 0.75 
        });

        // Requirement: Open popup at cluster center only after animation completes
        mapRef.current.once('moveend', () => {
          L.popup({
            className: 'intelligence-snapshot-popup',
            closeButton: false,
            offset: [0, 10]
          })
            .setLatLng(mapRef.current.getCenter())
            .setContent(generatePopupContent(nearbyRecords))
            .openOn(mapRef.current);
        });
      }
    });

    // 5. Automatic View Focusing
    try {
      const bounds = L.latLngBounds(data.map(d => [d.latitude, d.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    } catch (e) {
      console.warn("Could not calculate map bounds", e);
    }

    return () => {
      // Clean up if needed
    };
  }, [data, radius]);

  const handleRecenter = () => {
    if (mapRef.current) {
      // Use stored initial view if available, otherwise default to Yorkshire overview
      const center = mapRef.current.initialView?.center || [53.79, -1.54];
      const zoom = mapRef.current.initialView?.zoom || 8;
      mapRef.current.setView(center, zoom);
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner bg-slate-200 border border-slate-300">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Interactive Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 print:hidden">
        <button 
          onClick={handleRecenter}
          className="p-2 bg-white/90 hover:bg-white text-blue-600 rounded-lg shadow-md border border-slate-200 transition-all active:scale-95"
          title="Reset View to Yorkshire Overview"
        >
          <Target size={18} />
        </button>
      </div>

      {/* Requirement: Manual Heatmap Radius Adjustment Slider */}
      <div className="absolute top-4 right-16 z-[1000] bg-white/90 p-3 rounded-lg shadow-md border border-slate-200 flex flex-col gap-2 min-w-[140px] print:hidden">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-sans">Heat Radius</span>
          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{radius}px</span>
        </div>
        <input 
          type="range" min="5" max="80" step="1" 
          value={radius} 
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 p-2 rounded-lg shadow-md border border-slate-200 text-xs print:bg-white print:border-slate-100">
        <p className="font-bold mb-1">Density Legend</p>
        <div className="flex items-center gap-2">
          <div className="w-12 h-2 bg-gradient-to-r from-blue-500 via-lime-500 to-red-500 rounded"></div>
          <span>Low → High</span>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
