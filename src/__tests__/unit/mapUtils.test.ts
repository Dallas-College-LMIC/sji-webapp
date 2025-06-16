import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapManager } from '../../js/mapUtils';
import { mockGeoJSONResponse } from '../fixtures/apiResponses';
import '../mocks/mapbox-gl';

describe('MapManager', () => {
  let manager: MapManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a container element
    const container = document.createElement('div');
    container.id = 'test-map';
    document.body.appendChild(container);
    
    manager = new MapManager('test-map');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize map with correct config', () => {
      expect(mapboxgl.Map).toHaveBeenCalledWith({
        container: 'test-map',
        accessToken: "pk.eyJ1IjoiY2dpbGNocmllc3QtZGNjY2QiLCJhIjoiY200aXNueG5hMDV6czJtcTBweTFlZG9weSJ9.BV1l4NoP08wC2vlkhYR2Pg",
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-97.0336, 32.8999],
        zoom: 10.8,
        hash: true,
        attributionControl: true,
        customAttribution: '<b><a href="https://github.com/NYCPlanning/td-travelshed/blob/master/Transit%20Travelshed.pdf" target="_blank">Detailed Methodology</a></b>',
        preserveDrawingBuffer: true
      });
    });

    it('should add controls', () => {
      expect(manager.map.addControl).toHaveBeenCalledTimes(2);
    });
  });

  describe('addSource', () => {
    it('should add new source if it does not exist', () => {
      manager.map.getSource = vi.fn().mockReturnValue(null);
      
      manager.addSource('test-source', mockGeoJSONResponse);
      
      expect(manager.map.addSource).toHaveBeenCalledWith('test-source', {
        type: 'geojson',
        data: mockGeoJSONResponse
      });
    });

    it('should update existing source', () => {
      const mockSource = {
        type: 'geojson',
        setData: vi.fn()
      };
      manager.map.getSource = vi.fn().mockReturnValue(mockSource);
      
      manager.addSource('test-source', mockGeoJSONResponse);
      
      expect(mockSource.setData).toHaveBeenCalledWith(mockGeoJSONResponse);
      expect(manager.map.addSource).not.toHaveBeenCalled();
    });
  });

  describe('addLayer', () => {
    it('should remove existing layer before adding new one', () => {
      manager.map.getLayer = vi.fn().mockReturnValue({ id: 'existing-layer' });
      
      manager.addLayer('test-layer', 'test-source', 'test-property');
      
      expect(manager.map.removeLayer).toHaveBeenCalledWith('test-layer');
      expect(manager.map.addLayer).toHaveBeenCalledWith({
        id: 'test-layer',
        type: 'fill',
        source: 'test-source',
        layout: {
          visibility: 'visible'
        },
        paint: {
          'fill-color': expect.arrayContaining(['match', expect.any(Array)]),
          'fill-outline-color': 'rgba(0, 0, 0, 0.1)'
        }
      });
    });

    it('should add layer with specified visibility', () => {
      manager.map.getLayer = vi.fn().mockReturnValue(null);
      
      manager.addLayer('test-layer', 'test-source', 'test-property', 'none');
      
      expect(manager.map.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          layout: {
            visibility: 'none'
          }
        })
      );
    });
  });

  describe('setLayerVisibility', () => {
    it('should set layer visibility if layer exists', () => {
      manager.map.getLayer = vi.fn().mockReturnValue({ id: 'test-layer' });
      
      manager.setLayerVisibility('test-layer', 'none');
      
      expect(manager.map.setLayoutProperty).toHaveBeenCalledWith(
        'test-layer',
        'visibility',
        'none'
      );
    });

    it('should not set visibility if layer does not exist', () => {
      manager.map.getLayer = vi.fn().mockReturnValue(null);
      
      manager.setLayerVisibility('test-layer', 'none');
      
      expect(manager.map.setLayoutProperty).not.toHaveBeenCalled();
    });
  });

  describe('addPopupEvents', () => {
    it('should add click event handler', () => {
      manager.addPopupEvents('test-layer', 'Test Title', 'test_score');
      
      expect(manager.map.on).toHaveBeenCalledWith(
        'click',
        'test-layer',
        expect.any(Function)
      );
    });

    it('should add mouse enter/leave handlers', () => {
      manager.addPopupEvents('test-layer', 'Test Title', 'test_score');
      
      expect(manager.map.on).toHaveBeenCalledWith(
        'mouseenter',
        'test-layer',
        expect.any(Function)
      );
      expect(manager.map.on).toHaveBeenCalledWith(
        'mouseleave',
        'test-layer',
        expect.any(Function)
      );
    });
  });
});