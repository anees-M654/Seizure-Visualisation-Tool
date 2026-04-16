import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 1. Mock ResizeObserver (Missing in JSDOM)
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as any;

// 2. Mock Leaflet (Global L)
// Components like HeatMap use "declare const L: any" and expect it to be globally available.
const mockLeaflet = {
  map: vi.fn().mockReturnValue({
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    once: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    addLayer: vi.fn().mockReturnThis(),
    removeLayer: vi.fn().mockReturnThis(),
    addControl: vi.fn().mockReturnThis(),
    getCenter: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
    getZoom: vi.fn().mockReturnValue(8),
    flyToBounds: vi.fn().mockReturnThis(),
  }),
  tileLayer: vi.fn().mockReturnValue({
    addTo: vi.fn().mockReturnThis(),
    setUrl: vi.fn().mockReturnThis(),
  }),
  markerClusterGroup: vi.fn().mockReturnValue({
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn().mockReturnThis(),
    addLayer: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  }),
  latLng: vi.fn((lat, lng) => ({ 
    lat, lng, 
    distanceTo: vi.fn().mockReturnValue(0) 
  })),
  latLngBounds: vi.fn().mockImplementation(() => ({
    extend: vi.fn().mockReturnThis(),
    getCenter: vi.fn().mockReturnValue({ lat: 53.8, lng: -1.5 }),
    pad: vi.fn().mockReturnThis(),
    isValid: vi.fn().mockReturnValue(true),
  })),
  heatLayer: vi.fn().mockReturnValue({
    addTo: vi.fn().mockReturnThis(),
    setOptions: vi.fn().mockReturnThis(),
    setLatLngs: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
  }),
  circleMarker: vi.fn().mockReturnValue({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    getLatLng: vi.fn().mockReturnValue({ lat: 53.8, lng: -1.5 }),
  }),
  popup: vi.fn().mockReturnValue({
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    openOn: vi.fn().mockReturnThis(),
  }),
  FeatureGroup: vi.fn().mockImplementation(function(this: any) {
    this.addLayer = vi.fn().mockReturnThis();
    this.clearLayers = vi.fn().mockReturnThis();
    this.addTo = vi.fn().mockReturnThis();
  }),
  Control: {
    Draw: vi.fn().mockImplementation(function() {}),
  },
};

(global as any).L = mockLeaflet;

// 3. Mock Recharts
// ResponsiveContainer needs actual dimensions to render children, which JSDOM lacks.
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      React.createElement('div', { 
        style: { width: '800px', height: '600px' },
        className: 'recharts-responsive-container-mock' 
      }, React.cloneElement(children as React.ReactElement, { width: 800, height: 600 }))
    ),
  };
});
