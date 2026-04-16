
import React, { useEffect, useRef, useState } from 'react';
import { SeizureRecord } from './types';
import { Target } from 'lucide-react';

interface HeatMapProps {
  data: SeizureRecord[];
  isDarkMode: boolean;
  onSpatialFilter?: (filter: any) => void;
  activeSpatialFilter?: any;
}

// This component handles the Leaflet map and the heatmap layer.
// We use the global 'L' object which is loaded via CDN in index.html.
declare const L: any;

const HeatMap: React.FC<HeatMapProps> = ({ data, isDarkMode, onSpatialFilter, activeSpatialFilter }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
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
      
      

      // Store initial view for reset button
      mapRef.current.initialView = {
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom()
      };
    }

    // Toggle dark-map class for CSS-based tile filtering
    if (mapContainerRef.current) {
      if (isDarkMode) {
        mapContainerRef.current.classList.add('dark-map');
      } else {
        mapContainerRef.current.classList.remove('dark-map');
      }
    }

    // Update tile layer based on dark mode state
    // Using Carto basemaps to prevent 403 Access Blocked errors when the user opens the app as a local HTML file
    // (OpenStreetMap blocks requests from file:/// which lack Referer headers)
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    } else if (mapRef.current) {
      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors & CARTO'
      }).addTo(mapRef.current);
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

    // 2. Prepare MarkerCluster and Heatmap Layers
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 40,
        disableClusteringAtZoom: 16
      }).addTo(mapRef.current);
    }
    
    // Setup drawing tools
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
      mapRef.current.addLayer(drawnItemsRef.current);
      
      drawControlRef.current = new L.Control.Draw({
        edit: { featureGroup: drawnItemsRef.current, edit: false },
        draw: {
          polyline: false, marker: false, circlemarker: false,
          polygon: { shapeOptions: { color: '#3b82f6', weight: 2 } },
          rectangle: { shapeOptions: { color: '#3b82f6', weight: 2 } },
          circle: { shapeOptions: { color: '#3b82f6', weight: 2 } }
        }
      });
      mapRef.current.addControl(drawControlRef.current);

      mapRef.current.on('draw:created', (event: any) => {
        const layer = event.layer;
        drawnItemsRef.current.clearLayers();
        drawnItemsRef.current.addLayer(layer);

        if (onSpatialFilter) {
          if (event.layerType === 'circle') {
            onSpatialFilter({ type: 'circle', lat: layer.getLatLng().lat, lng: layer.getLatLng().lng, radiusMeters: layer.getRadius() });
          } else {
            onSpatialFilter({ type: event.layerType, latlngs: layer.getLatLngs()[0].map((l: any) => ({ lat: l.lat, lng: l.lng })) });
          }
        }
      });

      mapRef.current.on('draw:deleted', () => {
        if (onSpatialFilter) onSpatialFilter(null);
      });
    }

    // Keep drawn bounds visible if passed down from clear
    if (!activeSpatialFilter && drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }

    clusterGroupRef.current.clearLayers();

    const heatPoints: any[] = [];
    data.forEach(d => {
      heatPoints.push([d.latitude, d.longitude, (d.quantity || 1) * 0.2]);

      const marker = L.circleMarker([d.latitude, d.longitude], {
        radius: 6, fillColor: '#3b82f6', color: '#1d4ed8', weight: 2, fillOpacity: 0.8
      });
      
      marker.bindPopup(`
        <div class="px-1 py-1 font-sans">
          <p class="font-black text-blue-400 uppercase text-[9px] mb-1">${d.date.split('T')[0]}</p>
          <p class="text-[11px] font-bold text-white">${d.category} - ${d.itemType}</p>
          <p class="text-[10px] text-blue-200/80">${d.quantity} units seized</p>
        </div>
      `);
      clusterGroupRef.current.addLayer(marker);
    });

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
      
      // Requirement: Regular Area Intelligence popup
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
  }, [data, radius, isDarkMode]);

  const handleRecenter = () => {
    if (mapRef.current) {
      // Use stored initial view if available, otherwise default to Yorkshire overview
      const center = mapRef.current.initialView?.center || [53.79, -1.54];
      const zoom = mapRef.current.initialView?.zoom || 8;
      mapRef.current.setView(center, zoom);
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 transition-colors duration-300">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Interactive Controls Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 print:hidden">
        <button 
          onClick={handleRecenter}
          className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
          title="Reset View to Yorkshire Overview"
        >
          <Target size={18} />
        </button>
      </div>

      {/* Requirement: Manual Heatmap Radius Adjustment Slider */}
      <div className="absolute bottom-4 left-16 z-[1000] bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex flex-col gap-2 min-w-[140px] print:hidden transition-colors duration-300">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans">Heat Radius</span>
          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">{radius}px</span>
        </div>
        <input 
          type="range" min="5" max="80" step="1" 
          value={radius} 
          onChange={(e) => setRadius(Number.parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 print:bg-white print:border-slate-100 transition-colors duration-300">
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
