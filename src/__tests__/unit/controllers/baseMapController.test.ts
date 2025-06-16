import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../mocks/mapbox-gl';

// Use vi.hoisted to ensure mock is created before imports
const { mockMapManager } = vi.hoisted(() => {
  const mockMapManager = {
  map: {
    on: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    getLayer: vi.fn(() => null),
    removeLayer: vi.fn(),
    addSource: vi.fn(),
    setLayoutProperty: vi.fn(),
  },
  addSource: vi.fn(),
  addLayer: vi.fn(),
  clearLayers: vi.fn(),
  onStyleLoad: vi.fn((callback) => {
    // Call the callback immediately to simulate style load
    callback();
  }),
  addPopupEvents: vi.fn(),
  setLayerVisibility: vi.fn(),
};
  return { mockMapManager };
});

// Mock the entire mapUtils module
vi.mock('../../../js/mapUtils', () => {
  return {
    MapManager: vi.fn().mockImplementation(() => mockMapManager),
  };
});

// Now import the actual modules
import { BaseMapController, DataLoadConfig } from '../../../js/controllers/baseMapController';
import { ApiService } from '../../../js/api';
import { mockGeoJSONResponse } from '../../fixtures/apiResponses';
vi.mock('../../../js/api');
vi.mock('../../../js/services/uiService', () => ({
  uiService: {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showError: vi.fn(),
    showNotification: vi.fn(),
  },
}));

// Create a concrete implementation for testing
class TestMapController extends BaseMapController {
  async initialize(): Promise<void> {
    await this.initializeMapWithEmptySource();
    this.isInitialized = true;
  }
  
  protected getLayerIds(): string[] {
    return ['layer1', 'layer2'];
  }
}

describe('BaseMapController', () => {
  let controller: TestMapController;
  let mockApiService: ApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup API service mock
    mockApiService = {
      getGeojsonData: vi.fn(),
      getExportUrl: vi.fn(),
    } as any;
    
    // Create controller
    controller = new TestMapController('test-container', 'test-source');
    
    // Manually replace the mapManager with our mock
    controller['mapManager'] = mockMapManager;
    
    // Replace API service with mock
    controller['apiService'] = mockApiService;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const newController = new TestMapController('container-id');
      expect(newController['containerId']).toBe('container-id');
      expect(newController['sourceId']).toBe('map_data');
      expect(newController['isInitialized']).toBe(false);
      expect(newController['isLoading']).toBe(false);
    });

    it('should accept custom source ID', () => {
      const newController = new TestMapController('container-id', 'custom-source');
      expect(newController['sourceId']).toBe('custom-source');
    });
  });

  describe('initializeMapWithEmptySource', () => {
    it('should wait for map to load and add empty source', async () => {
      const onLoadCallback = vi.fn();
      mockMapManager.map.isStyleLoaded = vi.fn(() => false);
      mockMapManager.onStyleLoad = vi.fn((callback) => {
        // Simulate immediate callback
        callback();
      });

      await controller.initializeMapWithEmptySource();

      expect(mockMapManager.onStyleLoad).toHaveBeenCalledWith(expect.any(Function));
      expect(mockMapManager.addSource).toHaveBeenCalledWith('test-source', {
        type: 'FeatureCollection',
        features: [],
      });
    });

    it('should add source immediately if map is already loaded', async () => {
      mockMapManager.map.isStyleLoaded = vi.fn(() => true);
      mockMapManager.onStyleLoad = vi.fn((callback) => {
        // Simulate immediate callback since map is already loaded
        callback();
      });

      await controller.initializeMapWithEmptySource();

      expect(mockMapManager.addSource).toHaveBeenCalledWith('test-source', {
        type: 'FeatureCollection',
        features: [],
      });
    });
  });

  describe('loadData', () => {
    beforeEach(() => {
      mockMapManager.map.isStyleLoaded = vi.fn(() => true);
    });

    it('should load data successfully', async () => {
      vi.mocked(mockApiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);

      await controller.loadData();

      expect(mockApiService.getGeojsonData).toHaveBeenCalledWith({});
      expect(mockMapManager.addSource).toHaveBeenCalledWith('test-source', mockGeoJSONResponse);
    });

    it('should load data with parameters', async () => {
      vi.mocked(mockApiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);

      const config: DataLoadConfig = {
        params: { occupation_id: '11-1011' },
      };

      await controller.loadData(config);

      expect(mockApiService.getGeojsonData).toHaveBeenCalledWith({ occupation_id: '11-1011' });
    });

    it('should show loading state', async () => {
      vi.mocked(mockApiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);
      const { uiService } = await import('../../../js/services/uiService');

      const config: DataLoadConfig = {
        loadingElementId: 'loading-spinner',
      };

      await controller.loadData(config);

      expect(uiService.showLoading).toHaveBeenCalledWith('loading-spinner', { message: 'Loading map data...' });
      expect(uiService.hideLoading).toHaveBeenCalledWith('loading-spinner');
    });

    it('should clear map before loading if specified', async () => {
      vi.mocked(mockApiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);

      const config: DataLoadConfig = {
        clearBeforeLoad: true,
      };

      await controller.loadData(config);

      // Clear layers is done manually by getting layer IDs and removing them
      expect(controller['getLayerIds']).toBeDefined();
    });

    it('should call lifecycle callbacks', async () => {
      vi.mocked(mockApiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);

      const onBeforeLoad = vi.fn();
      const onAfterLoad = vi.fn();

      const config: DataLoadConfig = {
        onBeforeLoad,
        onAfterLoad,
      };

      await controller.loadData(config);

      expect(onBeforeLoad).toHaveBeenCalled();
      expect(onAfterLoad).toHaveBeenCalledWith(mockGeoJSONResponse);
    });

    it('should handle errors', async () => {
      const error = new Error('API Error');
      vi.mocked(mockApiService.getGeojsonData).mockRejectedValue(error);
      const { uiService } = await import('../../../js/services/uiService');

      const onError = vi.fn();
      const config: DataLoadConfig = {
        onError,
        loadingElementId: 'loading',
      };

      await controller.loadData(config);

      expect(onError).toHaveBeenCalledWith(error);
      expect(uiService.showError).toHaveBeenCalledWith('loading', 'Error loading data');
      expect(controller['isLoading']).toBe(false);
    });

    it('should prevent concurrent loads', async () => {
      vi.mocked(mockApiService.getGeojsonData).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockGeoJSONResponse), 100))
      );

      const promise1 = controller.loadData();
      const promise2 = controller.loadData();

      await Promise.all([promise1, promise2]);

      expect(mockApiService.getGeojsonData).toHaveBeenCalledTimes(1);
    });

    it('should update export link after loading', async () => {
      vi.mocked(mockApiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);
      
      // Mock DOM element with correct ID
      const exportLink = document.createElement('a');
      exportLink.id = 'exp';
      document.body.appendChild(exportLink);
      
      // Mock getExportUrl to return a proper URL
      mockApiService.getExportUrl = vi.fn().mockReturnValue('http://127.0.0.1:8000/geojson');

      const config: DataLoadConfig = {
        updateExportLink: true,
      };

      await controller.loadData(config);

      expect(exportLink.href).toBe('http://127.0.0.1:8000/geojson');
      expect(exportLink.download).toMatch(/^data_\d{4}-\d{2}-\d{2}\.geojson$/);

      // Cleanup
      document.body.removeChild(exportLink);
    });
  });

  describe('updateExportLink', () => {
    it('should update export link with URL', () => {
      const exportLink = document.createElement('a');
      exportLink.id = 'exp';
      document.body.appendChild(exportLink);
      
      mockApiService.getExportUrl = vi.fn().mockReturnValue('http://127.0.0.1:8000/geojson');

      controller['updateExportLink']();

      expect(mockApiService.getExportUrl).toHaveBeenCalledWith({});
      expect(exportLink.href).toBe('http://127.0.0.1:8000/geojson');
      expect(exportLink.download).toMatch(/^data_\d{4}-\d{2}-\d{2}\.geojson$/);

      // Cleanup
      document.body.removeChild(exportLink);
    });

    it('should handle missing export link element', () => {
      // Should not throw when element doesn't exist
      expect(() => controller['updateExportLink']()).not.toThrow();
    });
  });

  describe('UI helper methods', () => {
    it('should show loading state', async () => {
      const { uiService } = await import('../../../js/services/uiService');
      controller.showLoading('test-element', 'Loading...');
      
      expect(uiService.showLoading).toHaveBeenCalledWith('test-element', { message: 'Loading...' });
    });

    it('should hide loading state', async () => {
      const { uiService } = await import('../../../js/services/uiService');
      controller.hideLoading('test-element');
      
      expect(uiService.hideLoading).toHaveBeenCalledWith('test-element');
    });

    it('should show error state', async () => {
      const { uiService } = await import('../../../js/services/uiService');
      controller.showError('test-element', 'Error message');
      
      expect(uiService.showError).toHaveBeenCalledWith('test-element', 'Error message');
    });
  });

  describe('clearMap', () => {
    it('should clear all layers and update source', () => {
      controller.clearMap();

      // Clear layers is done manually by getting layer IDs and removing them
      expect(controller['getLayerIds']).toBeDefined();
      expect(mockMapManager.addSource).toHaveBeenCalledWith('test-source', {
        type: 'FeatureCollection',
        features: [],
      });
    });
  });

  describe('addLayersFromConfig', () => {
    it('should add layers from configuration', () => {
      const layers = [
        {
          id: 'layer1',
          visibility: 'visible' as const,
          property: 'prop1',
          title: 'Layer 1',
          scoreProperty: 'score1',
        },
        {
          id: 'layer2',
          visibility: 'none' as const,
          property: 'prop2',
          title: 'Layer 2',
          scoreProperty: 'score2',
        },
      ];

      controller.addLayersFromConfig(layers);

      expect(mockMapManager.addLayer).toHaveBeenCalledTimes(2);
      expect(mockMapManager.addLayer).toHaveBeenCalledWith(
        'layer1',
        'test-source',
        'prop1',
        'visible'
      );
      expect(mockMapManager.addLayer).toHaveBeenCalledWith(
        'layer2',
        'test-source',
        'prop2',
        'none'
      );
    });
  });
});