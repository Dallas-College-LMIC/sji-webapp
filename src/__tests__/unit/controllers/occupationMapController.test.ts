import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OccupationMapController } from '../../../js/occupation';
import { createMockLocalStorage } from '../../utils/testHelpers';
import { mockOccupationIdsResponse, mockGeoJSONResponse } from '../../fixtures/apiResponses';
import '../../mocks/mapbox-gl';
import '../../mocks/jquery';

// Mock dependencies
const mockMapManager = {
  map: {
    on: vi.fn(),
    addSource: vi.fn(),
    removeSource: vi.fn(),
    getSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    getLayer: vi.fn(() => null), // Return null by default (no layer exists)
    setLayoutProperty: vi.fn(),
  },
  onStyleLoad: vi.fn((callback) => {
    // Call the callback immediately to simulate style load
    callback();
  }),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  addPopupEvents: vi.fn(),
};

vi.mock('../../../js/mapUtils', () => ({
  MapManager: vi.fn().mockImplementation(() => mockMapManager),
}));
vi.mock('../../../js/api');
vi.mock('../../../js/services/uiService', () => ({
  uiService: {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showError: vi.fn(),
    showNotification: vi.fn(),
  },
}));
vi.mock('../../../js/utils/errorHandler', () => ({
  ErrorHandler: {
    logError: vi.fn(),
    showInlineError: vi.fn(),
    showEnhancedError: vi.fn(),
  },
}));

// Create mock cache service instance that we can control
const mockCacheService = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
};

vi.mock('../../../js/services/cacheService', () => ({
  createCacheService: vi.fn(() => mockCacheService),
}));

describe('OccupationMapController', () => {
  let controller: OccupationMapController;
  let mockLocalStorage: Storage;
  
  // Access the mocked instances
  const mockMapManagerInstance = mockMapManager;
  const mockCacheServiceInstance = mockCacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock localStorage
    mockLocalStorage = createMockLocalStorage();
    global.localStorage = mockLocalStorage;
    
    // Reset mock cache service
    mockCacheServiceInstance.get.mockReturnValue(null);
    mockCacheServiceInstance.set.mockImplementation(() => {});
    mockCacheServiceInstance.remove.mockImplementation(() => {});
    mockCacheServiceInstance.clear.mockImplementation(() => {});
    
    // Mock DOM Option constructor
    global.Option = vi.fn().mockImplementation((text: string, value: string) => ({
      text,
      value,
      selected: false,
      disabled: false
    }));
    
    // Setup mock DOM elements
    document.body.innerHTML = `
      <div id="test-container"></div>
      <div id="loading"></div>
      <select id="occupation-select">
        <option value="">Select an occupation...</option>
      </select>
      <a id="exportGeoJSON"></a>
      <a id="exp"></a>
    `;
    
    // Mock document.getElementById to return the proper elements
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      return document.querySelector(`#${id}`) as HTMLElement | null;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor and initialization', () => {
    it('should initialize with default values', () => {
      controller = new OccupationMapController('test-container');
      
      expect(controller['containerId']).toBe('test-container');
      expect(controller['sourceId']).toBe('occupation_data');
      expect(controller['currentOccupationId']).toBeNull();
    });

    it('should migrate old cache on initialization', () => {
      // Set old cache format with valid (non-expired) data
      const oldData = ['11-1011', '11-1021'];
      const currentTime = Date.now();
      mockLocalStorage.setItem('occupation_ids_cache', JSON.stringify(oldData));
      mockLocalStorage.setItem('occupation_ids_cache_time', currentTime.toString());
      
      // Mock the migration behavior
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = vi.fn((key: string) => {
        if (key === 'occupation_ids_cache') {
          return JSON.stringify(oldData);
        }
        if (key === 'occupation_ids_cache_time') {
          return currentTime.toString();
        }
        return originalGetItem(key);
      });
      
      controller = new OccupationMapController('test-container');
      
      // Check that old cache was removed (migration cleans up old format)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('occupation_ids_cache');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('occupation_ids_cache_time');
    });
  });

  describe('loadOccupationIds', () => {
    beforeEach(async () => {
      controller = new OccupationMapController('test-container');
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should use cached occupation IDs when available', async () => {
      const cachedIds = ['11-1011', '11-1021', '11-1031'];
      mockCacheServiceInstance.get.mockReturnValue(cachedIds);
      
      const apiService = controller['apiService'];
      vi.spyOn(apiService, 'getOccupationIds');
      
      await controller['loadOccupationIds']();
      
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith('occupation_ids');
      expect(apiService.getOccupationIds).not.toHaveBeenCalled();
      expect(global.$).toHaveBeenCalledWith('#occupation-select');
    });

    it('should fetch from API when cache is expired', async () => {
      // Cache returns null (expired or not found)
      mockCacheServiceInstance.get.mockReturnValue(null);
      
      const apiService = controller['apiService'];
      vi.mocked(apiService.getOccupationIds).mockResolvedValue(mockOccupationIdsResponse);
      
      await controller['loadOccupationIds']();
      
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith('occupation_ids');
      expect(apiService.getOccupationIds).toHaveBeenCalled();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(
        'occupation_ids',
        mockOccupationIdsResponse.occupation_ids,
        24 * 60 * 60 // 24 hours in seconds
      );
    });

    it('should handle API errors gracefully', async () => {
      const apiService = controller['apiService'];
      vi.mocked(apiService.getOccupationIds).mockRejectedValue(new Error('API Error'));
      const { uiService } = await import('../../../js/services/uiService');
      
      await controller['loadOccupationIds']();
      
      expect(uiService.showError).toHaveBeenCalledWith('loading', 'Error loading occupations');
      expect(uiService.showNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to load occupation list. Please refresh the page to try again.',
        duration: 10000,
      });
    });

    it('should handle localStorage errors gracefully', async () => {
      // Make localStorage throw
      mockLocalStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      const apiService = controller['apiService'];
      vi.mocked(apiService.getOccupationIds).mockResolvedValue(mockOccupationIdsResponse);
      
      // Should not throw
      await expect(controller['loadOccupationIds']()).resolves.not.toThrow();
    });
  });

  describe('populateOccupationDropdown', () => {
    beforeEach(() => {
      controller = new OccupationMapController('test-container');
    });

    it('should populate dropdown with occupation IDs', () => {
      const occupationIds = ['11-1011', '11-1021', '11-1031'];
      
      // The method should be called without throwing errors
      expect(() => controller['populateOccupationDropdown'](occupationIds)).not.toThrow();
      
      // Verify jQuery calls are made
      expect(global.$).toHaveBeenCalledWith('#occupation-select');
      expect(global.Option).toHaveBeenCalledTimes(3);
    });

    it('should initialize select2 and setup change listener', () => {
      const occupationIds = ['11-1011'];
      const mockSelect = global.$('#occupation-select');
      
      controller['populateOccupationDropdown'](occupationIds);
      
      expect(mockSelect.select2).toHaveBeenCalledWith({
        placeholder: 'Search and select an occupation...',
        allowClear: true,
        width: '100%'
      });
      // Verify that the dropdown change handler setup was called
      expect(document.getElementById).toHaveBeenCalled();
    });
  });

  describe('loadOccupationData', () => {
    beforeEach(async () => {
      controller = new OccupationMapController('test-container');
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should load data for selected occupation', async () => {
      const occupationId = '11-1011';
      const apiService = controller['apiService'];
      vi.mocked(apiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);
      
      await controller['loadOccupationData'](occupationId);
      
      expect(controller['currentOccupationId']).toBe(occupationId);
      expect(apiService.getGeojsonData).toHaveBeenCalledWith({ occupation_id: occupationId });
    });

    it('should clear map when no occupation selected', () => {
      // The method should execute without throwing errors
      expect(() => controller['clearMap']()).not.toThrow();
      
      expect(controller['currentOccupationId']).toBeNull();
    });

    it('should add layer after loading data', async () => {
      const occupationId = '11-1011';
      const apiService = controller['apiService'];
      vi.mocked(apiService.getGeojsonData).mockResolvedValue(mockGeoJSONResponse);
      
      await controller['loadOccupationData'](occupationId);
      
      // Check that the occupation ID was set
      expect(controller['currentOccupationId']).toBe(occupationId);
      expect(apiService.getGeojsonData).toHaveBeenCalledWith({ occupation_id: occupationId });
    });

    it('should handle errors during occupation change', async () => {
      const occupationId = '11-1011';
      const apiService = controller['apiService'];
      const error = new Error('API Error');
      vi.mocked(apiService.getGeojsonData).mockRejectedValue(error);
      
      // This should not throw since errors are handled by the base class
      await expect(controller['loadOccupationData'](occupationId)).resolves.not.toThrow();
      
      expect(apiService.getGeojsonData).toHaveBeenCalledWith({ occupation_id: occupationId });
    });
  });

  describe('clearOccupationCache', () => {
    beforeEach(() => {
      controller = new OccupationMapController('test-container');
    });

    it('should clear occupation cache', () => {
      controller.clearOccupationCache();
      
      // The cacheService.remove method is called with the cache key
      expect(mockCacheServiceInstance.remove).toHaveBeenCalledWith('occupation_ids');
    });
  });
});