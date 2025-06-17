import { vi } from 'vitest';

// Mock Mapbox GL JS
export const mockMap = {
  on: vi.fn((event, callback) => {
    if (event === 'load') {
      setTimeout(callback, 0);
    }
  }),
  off: vi.fn(),
  once: vi.fn(),
  addControl: vi.fn(),
  removeControl: vi.fn(),
  addSource: vi.fn(),
  removeSource: vi.fn(),
  getSource: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  getLayer: vi.fn(),
  setLayoutProperty: vi.fn(),
  setPaintProperty: vi.fn(),
  setFilter: vi.fn(),
  queryRenderedFeatures: vi.fn(),
  getCanvas: vi.fn(() => ({
    style: { cursor: '' },
  })),
  remove: vi.fn(),
  resize: vi.fn(),
  fitBounds: vi.fn(),
  getZoom: vi.fn(() => 10),
  setZoom: vi.fn(),
  getCenter: vi.fn(() => ({ lng: -97.0336, lat: 32.8999 })),
  setCenter: vi.fn(),
  easeTo: vi.fn(),
  flyTo: vi.fn(),
  project: vi.fn(),
  unproject: vi.fn(),
};

export const mockPopup = {
  setLngLat: vi.fn().mockReturnThis(),
  setHTML: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  isOpen: vi.fn(() => false),
};

export const mockNavigationControl = vi.fn();
export const mockFullscreenControl = vi.fn();

// Create the mock mapboxgl object
export const mapboxgl = {
  Map: vi.fn(() => mockMap),
  Popup: vi.fn(() => mockPopup),
  NavigationControl: mockNavigationControl,
  FullscreenControl: mockFullscreenControl,
  accessToken: '',
  supported: vi.fn(() => true),
  LngLat: vi.fn((lng: number, lat: number) => ({ lng, lat })),
  LngLatBounds: vi.fn(),
};

// Make it available globally
(globalThis as any).mapboxgl = mapboxgl;