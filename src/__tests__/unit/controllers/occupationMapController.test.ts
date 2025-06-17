import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '../../mocks/mapbox-gl';
import '../../mocks/jquery';
import { setupOccupationControllerMocks } from '../../utils/occupationTestHelpers';
import { createMockLocalStorage } from '../../utils/testHelpers';
import { mockOccupationIdsResponse, mockGeoJSONResponse } from '../../fixtures/apiResponses';

// Setup all mocks before imports
setupOccupationControllerMocks();

// Now import the actual modules
import { OccupationMapController } from '../../../js/occupation';
import { uiService } from '../../../js/services/uiService';

describe('OccupationMapController', () => {
  let controller: OccupationMapController;
  let mockLocalStorage: Storage;
  let mockApiService: any;
  let mockCacheService: any;
  let mockOccupationCache: any;
  let mockMapManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mock localStorage
    mockLocalStorage = createMockLocalStorage();
    global.localStorage = mockLocalStorage;
    
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

    // Create controller
    controller = new OccupationMapController('test-container');
    
    // Get mocked services from the controller
    mockApiService = (controller as any).apiService;
    mockCacheService = (controller as any).cacheService;
    mockOccupationCache = (controller as any).occupationCache;
    mockMapManager = (controller as any).mapManager;
    
    // If services are not mocked properly, add mock methods
    if (!mockApiService.getOccupationIds) {
      mockApiService.getOccupationIds = vi.fn();
      mockApiService.getOccupationData = vi.fn();
      mockApiService.cancelAllRequests = vi.fn();
      mockApiService.createAbortController = vi.fn(() => new AbortController());
      mockApiService.cancelRequest = vi.fn();
      mockApiService.getAbortController = vi.fn();
    }
    if (!mockCacheService.get) {
      mockCacheService.get = vi.fn();
      mockCacheService.set = vi.fn();
      mockCacheService.remove = vi.fn();
    }
    if (!mockOccupationCache.get) {
      mockOccupationCache.get = vi.fn();
      mockOccupationCache.set = vi.fn();
      mockOccupationCache.clear = vi.fn();
      mockOccupationCache.getDebugInfo = vi.fn();
    }
    if (!mockMapManager.addSource) {
      mockMapManager.addSource = vi.fn();
    }

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor and initialization', () => {
    it('should initialize with default values', async () => {
      expect(controller['containerId']).toBe('test-container');
      expect(controller['sourceId']).toBe('occupation_data');
      expect((controller as any).currentOccupationId).toBeNull();
    });

    it('should migrate old cache on initialization', async () => {
      // Set old cache format with valid (non-expired) data
      const oldData = ['11-1011', '11-1021'];
      const currentTime = Date.now();
      mockLocalStorage.setItem('occupation_ids_cache', JSON.stringify(oldData));
      mockLocalStorage.setItem('occupation_ids_cache_time', currentTime.toString());
      
      // Create new controller which should trigger migration
      // Create new controller which should trigger migration
      new OccupationMapController('test-container');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that old cache was removed (migration cleans up old format)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('occupation_ids_cache');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('occupation_ids_cache_time');
    });
  });

  describe('loadOccupationIds', () => {
    it('should use cached occupation IDs when available', async () => {
      const cachedIds = ['11-1011', '11-1021', '11-1031'];
      mockCacheService.get.mockReturnValue(cachedIds);
      
      await controller['loadOccupationIds']();
      
      expect(mockCacheService.get).toHaveBeenCalledWith('occupation_ids');
      expect(mockApiService.getOccupationIds).not.toHaveBeenCalled();
      expect((global as any).$).toHaveBeenCalledWith('#occupation-select');
    });

    it('should fetch from API when cache is expired', async () => {
      // Cache returns null (expired or not found)
      mockCacheService.get.mockReturnValue(null);
      mockApiService.getOccupationIds.mockResolvedValue(mockOccupationIdsResponse);
      
      await controller['loadOccupationIds']();
      
      expect(mockCacheService.get).toHaveBeenCalledWith('occupation_ids');
      expect(mockApiService.getOccupationIds).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'occupation_ids',
        mockOccupationIdsResponse.occupation_ids,
        24 * 60 * 60 // 24 hours in seconds
      );
    });

    it('should handle API errors gracefully', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockApiService.getOccupationIds.mockRejectedValue(new Error('API Error'));
      
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
      
      mockCacheService.get.mockReturnValue(null);
      mockApiService.getOccupationIds.mockResolvedValue(mockOccupationIdsResponse);
      
      // Should not throw
      await expect(controller['loadOccupationIds']()).resolves.not.toThrow();
    });
  });

  describe('populateOccupationDropdown', () => {
    it('should populate dropdown with occupation IDs', () => {
      const occupationIds = ['11-1011', '11-1021', '11-1031'];
      
      // The method should be called without throwing errors
      expect(() => controller['populateOccupationDropdown'](occupationIds)).not.toThrow();
      
      // Verify jQuery calls are made
      expect((global as any).$).toHaveBeenCalledWith('#occupation-select');
      expect(global.Option).toHaveBeenCalledTimes(3);
    });

    it('should initialize select2 and setup change listener', () => {
      const occupationIds = ['11-1011'];
      const mockSelect = (global as any).$('#occupation-select');
      
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
    it('should load data for selected occupation', async () => {
      const occupationId = '11-1011';
      mockOccupationCache.get.mockResolvedValue(null);
      mockApiService.getOccupationData.mockResolvedValue(mockGeoJSONResponse);
      
      await controller['loadOccupationData'](occupationId);
      
      expect(mockApiService.getOccupationData).toHaveBeenCalledWith(occupationId, expect.any(AbortSignal));
    });

    it('should clear map when no occupation selected', () => {
      // The method should execute without throwing errors
      expect(() => controller['clearMap']()).not.toThrow();
    });

    it('should add layer after loading data', async () => {
      const occupationId = '11-1011';
      mockOccupationCache.get.mockResolvedValue(null);
      mockApiService.getOccupationData.mockResolvedValue(mockGeoJSONResponse);
      
      await controller['loadOccupationData'](occupationId);
      
      expect(mockApiService.getOccupationData).toHaveBeenCalledWith(occupationId, expect.any(AbortSignal));
      expect(mockMapManager.addSource).toHaveBeenCalled();
    });

    it('should handle errors during occupation change', async () => {
      const occupationId = '11-1011';
      const error = new Error('API Error');
      mockOccupationCache.get.mockResolvedValue(null);
      mockApiService.getOccupationData.mockRejectedValue(error);
      
      // This should not throw since errors are handled
      await expect(controller['loadOccupationData'](occupationId)).resolves.not.toThrow();
      
      expect(mockApiService.getOccupationData).toHaveBeenCalledWith(occupationId, expect.any(AbortSignal));
      expect(uiService.showError).toHaveBeenCalledWith('loading', 'Error loading occupation data');
    });

    it('should use cached data when available', async () => {
      const occupationId = '11-1011';
      const cachedData = mockGeoJSONResponse;
      mockOccupationCache.get.mockResolvedValue(cachedData);
      
      await controller['loadOccupationData'](occupationId);
      
      expect(mockOccupationCache.get).toHaveBeenCalledWith(occupationId);
      expect(mockApiService.getOccupationData).not.toHaveBeenCalled();
      expect(mockMapManager.addSource).toHaveBeenCalledWith('occupation_data', cachedData);
    });

    it('should prevent concurrent loads of same occupation', async () => {
      const occupationId = '11-1011';
      mockOccupationCache.get.mockResolvedValue(null);
      
      // Ensure no previous occupation is set and controller is not loading
      (controller as any).currentOccupationId = null;
      (controller as any).isLoading = false;
      
      // Create a delayed promise to simulate slow API call
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiService.getOccupationData.mockReturnValue(delayedPromise);
      
      // Start two concurrent loads
      const load1 = controller['loadOccupationData'](occupationId);
      const load2 = controller['loadOccupationData'](occupationId);
      
      // The second request should wait for the first due to activeRequests Map
      expect(controller['activeRequests'].size).toBe(1);
      
      // Resolve the promise
      resolvePromise!(mockGeoJSONResponse);
      
      // Wait for both to complete
      await Promise.all([load1, load2]);
      
      // Verify deduplication worked
      expect(controller['activeRequests'].size).toBe(0);
    });
  });

  describe('clearOccupationCache', () => {
    it('should clear occupation cache', () => {
      controller.clearOccupationCache();
      
      // The cacheService.remove method is called with the cache key
      expect(mockCacheService.remove).toHaveBeenCalledWith('occupation_ids');
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', () => {
      controller.clearAllCaches();
      
      expect(mockCacheService.remove).toHaveBeenCalledWith('occupation_ids');
      expect(mockOccupationCache.clear).toHaveBeenCalled();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const mockStats = {
        memoryEntries: 5,
        memoryUsageMB: 10,
        hitRate: 85,
        preloadQueue: 2,
        stats: {
          hits: 85,
          misses: 15,
          totalRequests: 100
        }
      };
      mockOccupationCache.getDebugInfo.mockReturnValue(mockStats);
      
      const stats = controller.getCacheStats();
      
      expect(stats).toEqual(mockStats);
    });
  });
});