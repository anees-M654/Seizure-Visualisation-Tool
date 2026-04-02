
import React, { useEffect, useRef } from 'react';
import { SeizureRecord } from '../types';

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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize the map instance if it doesn't exist yet.
    if (!mapRef.current) {
      // Centering on Leeds/Yorkshire area by default.
      mapRef.current = L.map(mapContainerRef.current).setView([53.79, -1.54], 8);
      
      // Standard OpenStreetMap tiles - no API key required for this.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // 2. Prepare the heatmap points: [Lat, Lng, Intensity].
    // We use the 'quantity' field to influence the intensity of the "heat".
    // Increased the multiplier to 0.2 to make points more visible.
    const heatPoints = data.map(d => [d.latitude, d.longitude, (d.quantity || 1) * 0.2]);

    // 3. Refresh the heatmap layer.
    // We remove the old layer before adding the new one to prevent memory leaks and ghosting.
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    if (heatPoints.length > 0) {
      // Create the heat layer with a custom gradient: Blue (low) -> Lime -> Red (high).
      // Increased radius and added minOpacity for better visibility from a distance.
      heatLayerRef.current = L.heatLayer(heatPoints, {
        radius: 35,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.5,
        gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
      }).addTo(mapRef.current);

      // 4. Interactive Popups:
      // We add a click listener to the map. When an analyst clicks an area, 
      // we find nearby records and show a summary popup.
      mapRef.current.on('click', (e: any) => {
        const clickLatLng = e.latlng;
        
        // Find records within a certain distance (approx 2km for this zoom level)
        const nearbyRecords = data.filter(d => {
          const dist = clickLatLng.distanceTo(L.latLng(d.latitude, d.longitude));
          return dist < 2000; // 2km radius
        });

        if (nearbyRecords.length > 0) {
          // We show up to 15 records in the scrollable list
          const summary = nearbyRecords.slice(0, 15).map(r => 
            `<div class="mb-2 pb-1 border-b border-slate-100 last:border-0">
              <p class="font-bold text-blue-700 uppercase" style="font-size: 9px;">${r.category}</p>
              <p class="text-slate-600" style="font-size: 10px;">${r.item} (${r.quantity} units)</p>
              <p class="text-slate-400 italic" style="font-size: 8px;">${r.date.split('T')[0]} - ${r.city}</p>
            </div>`
          ).join('');

          const popupContent = `
            <div class="p-1 font-sans" style="width: 180px;">
              <h4 class="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2">Area Intelligence (${nearbyRecords.length} records)</h4>
              <div style="max-height: 160px; overflow-y: auto; padding-right: 4px; scrollbar-width: thin;">
                ${summary}
              </div>
              ${nearbyRecords.length > 15 ? `<p class="text-[8px] font-bold text-slate-400 text-center mt-1">+ ${nearbyRecords.length - 15} more in this cluster</p>` : ''}
            </div>
          `;

          L.popup()
            .setLatLng(clickLatLng)
            .setContent(popupContent)
            .openOn(mapRef.current);
        }
      });

      // 5. Automatic View Focusing:
      // We calculate the bounding box of all current points and zoom the map to fit them perfectly.
      try {
        const bounds = L.latLngBounds(data.map(d => [d.latitude, d.longitude]));
        mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      } catch (e) {
        console.warn("Could not calculate map bounds", e);
      }
    }

    return () => {
      // Clean up if needed
    };
  }, [data]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner bg-slate-200 border border-slate-300">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 p-2 rounded-lg shadow-md border border-slate-200 text-xs">
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
