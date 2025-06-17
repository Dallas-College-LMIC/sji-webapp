import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { OccupationMapController } from '../../js/occupation';
import { createMockLocalStorage } from '../utils/testHelpers';
import type { GeoJSONResponse, OccupationIdsResponse } from '../../types/api';
import { ApiService } from '../../js/api';
import '../mocks/mapbox-gl';
import '../mocks/jquery';

// Mock external dependencies
vi.mock('../../js/api');
vi.mock('../../js/services/uiService', () => ({
  uiService: {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showNotification: vi.fn()
  }
}));

// Mock DOM elements
const originalGetElementById = document.getElementById;
document.getElementById = vi.fn((id: string) => {
  if (id === 'map') {
    return { offsetWidth: 800, offsetHeight: 600 } as any;
  }
  if (id === 'loading' || id === 'exp') {
    return { style: { display: 'none' }, href: '', download: '' } as any;
  }
  if (id === 'occupation-select') {
    return { 
      options: [],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    } as any;
  }
  return originalGetElementById.call(document, id);
}) as any;

describe('Occupation Caching Integration', () => {
  let controller: OccupationMapController;
  let mockApiService: jest.Mocked<ApiService>;
  const mockOccupationIds = ['11-1011', '15-1132', '17-2051', '25-1011', '29-1141'];
  const mockOccupationData: GeoJSONResponse = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          GEOID: '48001020100',
          openings_2024_zscore: 1.5,
          openings_2024_zscore_color: '#ff0000'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-97.0, 32.8], [-97.0, 32.9], [-97.1, 32.9], [-97.1, 32.8], [-97.0, 32.8]]]
        }
      }
    ]
  };

  beforeEach(() => {
    // Setup mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: createMockLocalStorage(),
      configurable: true,
      writable: true
    });
    
    // Setup API service mock
    mockApiService = {
      getOccupationIds: vi.fn().mockResolvedValue({ occupation_ids: mockOccupationIds } as OccupationIdsResponse),
      getOccupationData: vi.fn().mockResolvedValue(mockOccupationData),
      getOccupationExportUrl: vi.fn().mockReturnValue('http://api.test/export/occupation/17-2051')
    } as any;
    
    vi.mocked(ApiService).mockImplementation(() => mockApiService as any);
    
    // Mock environment variables
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.unstubAllEnvs();
  });

  describe('Occupation IDs Caching Workflow', () => {
    it('should cache occupation IDs after first load', async () => {
      // Create controller - this triggers initialization
      controller = new OccupationMapController('map');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify API was called
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
      
      // Create another controller - should use cache
      const controller2 = new OccupationMapController('map');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // API should not be called again
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
      
      // Verify data is in cache
      const cachedData = JSON.parse(localStorage.getItem('sji_webapp_occupation_ids_cache') || 'null');
      expect(cachedData).toEqual(mockOccupationIds);
    });

    it('should handle cache expiration', async () => {
      // Pre-populate cache with expired data
      const expiredTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      localStorage.setItem('sji_webapp_occupation_ids_cache', JSON.stringify(mockOccupationIds));
      localStorage.setItem('sji_webapp_occupation_ids_cache_time', expiredTime.toString());
      
      // Create controller
      controller = new OccupationMapController('map');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should call API because cache is expired
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      mockApiService.getOccupationIds.mockRejectedValue(new Error('API Error'));
      
      // Create controller
      controller = new OccupationMapController('map');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have attempted API call
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
      
      // Cache should remain empty
      const cachedData = localStorage.getItem('sji_webapp_occupation_ids_cache');
      expect(cachedData).toBeNull();
    });

    it('should migrate old cache format', async () => {
      // Setup old cache format
      const oldCacheKey = 'occupation_ids_cache';
      const oldCacheTimeKey = 'occupation_ids_cache_time';
      const validTime = Date.now() - (1 * 60 * 60 * 1000); // 1 hour ago
      
      localStorage.setItem(oldCacheKey, JSON.stringify(mockOccupationIds));
      localStorage.setItem(oldCacheTimeKey, validTime.toString());
      
      // Create controller - should migrate cache
      controller = new OccupationMapController('map');
      
      // Wait for migration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify old cache is removed
      expect(localStorage.getItem(oldCacheKey)).toBeNull();
      expect(localStorage.getItem(oldCacheTimeKey)).toBeNull();
      
      // Verify new cache has data
      const newCachedData = JSON.parse(localStorage.getItem('sji_webapp_occupation_ids_cache') || 'null');
      expect(newCachedData).toEqual(mockOccupationIds);
      
      // API should not be called since we migrated valid cache
      expect(mockApiService.getOccupationIds).not.toHaveBeenCalled();
    });

    it('should clean up expired old cache during migration', async () => {
      // Setup old cache format with expired data
      const oldCacheKey = 'occupation_ids_cache';
      const oldCacheTimeKey = 'occupation_ids_cache_time';
      const expiredTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      
      localStorage.setItem(oldCacheKey, JSON.stringify(mockOccupationIds));
      localStorage.setItem(oldCacheTimeKey, expiredTime.toString());
      
      // Create controller
      controller = new OccupationMapController('map');
      
      // Wait for migration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify old cache is removed
      expect(localStorage.getItem(oldCacheKey)).toBeNull();
      expect(localStorage.getItem(oldCacheTimeKey)).toBeNull();
      
      // Verify new cache is empty (expired data not migrated)
      const newCachedData = localStorage.getItem('sji_webapp_occupation_ids_cache');
      expect(newCachedData).toBeNull();
      
      // API should be called since expired cache wasn't migrated
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
    });
  });

  describe('Occupation Data Caching Workflow', () => {
    beforeEach(async () => {
      // Create controller with cached occupation IDs
      localStorage.setItem('sji_webapp_occupation_ids_cache', JSON.stringify(mockOccupationIds));
      localStorage.setItem('sji_webapp_occupation_ids_cache_time', (Date.now() + 3600000).toString());
      
      controller = new OccupationMapController('map');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should cache occupation data after first load', async () => {
      // Mock the loadOccupationData method to be callable
      const loadSpy = vi.spyOn(controller as any, 'loadOccupationDataDirect');
      
      // First load
      await (controller as any).loadOccupationData('17-2051');
      
      expect(mockApiService.getOccupationData).toHaveBeenCalledWith('17-2051');
      expect(loadSpy).toHaveBeenCalledTimes(1);
      
      // Second load - should use cache
      await (controller as any).loadOccupationData('17-2051');
      
      // API should not be called again
      expect(mockApiService.getOccupationData).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent requests for same occupation', async () => {
      // Make multiple concurrent requests
      const promises = [
        (controller as any).loadOccupationData('17-2051'),
        (controller as any).loadOccupationData('17-2051'),
        (controller as any).loadOccupationData('17-2051')
      ];
      
      await Promise.all(promises);
      
      // API should only be called once despite multiple requests
      expect(mockApiService.getOccupationData).toHaveBeenCalledTimes(1);
    });

    it('should preload related occupations', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Load occupation that should trigger preloading
      await (controller as any).loadOccupationData('17-2051');
      
      // Wait for preload processing
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Should have attempted to preload related occupations
      expect(mockApiService.getOccupationData).toHaveBeenCalledTimes(1); // Initial load only
      
      // Check for preload logging
      const preloadLogs = consoleSpy.mock.calls.filter(call => 
        call[0].includes('Preloaded') || call[0].includes('Would preload')
      );
      
      expect(preloadLogs.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });

    it('should handle occupation data API errors', async () => {
      mockApiService.getOccupationData.mockRejectedValue(new Error('Data API Error'));
      
      // Should not throw
      await expect((controller as any).loadOccupationData('17-2051')).resolves.not.toThrow();
      
      expect(mockApiService.getOccupationData).toHaveBeenCalledWith('17-2051');
    });

    it('should track cache performance metrics', async () => {
      // Load occupation data
      await (controller as any).loadOccupationData('17-2051');
      
      // Get cache stats
      const stats = controller.getCacheStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      localStorage.setItem('sji_webapp_occupation_ids_cache', JSON.stringify(mockOccupationIds));
      localStorage.setItem('sji_webapp_occupation_ids_cache_time', (Date.now() + 3600000).toString());
      
      controller = new OccupationMapController('map');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should clear occupation IDs cache', () => {
      // Verify cache exists
      expect(localStorage.getItem('sji_webapp_occupation_ids_cache')).not.toBeNull();
      
      // Clear cache
      controller.clearOccupationCache();
      
      // Verify cache is cleared
      expect(localStorage.getItem('sji_webapp_occupation_ids_cache')).toBeNull();
    });

    it('should clear all caches', async () => {
      // Load some occupation data first
      await (controller as any).loadOccupationData('17-2051');
      
      // Verify caches have data
      expect(localStorage.getItem('sji_webapp_occupation_ids_cache')).not.toBeNull();
      const stats = controller.getCacheStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
      
      // Clear all caches
      controller.clearAllCaches();
      
      // Verify occupation IDs cache is cleared
      expect(localStorage.getItem('sji_webapp_occupation_ids_cache')).toBeNull();
      
      // Verify occupation data cache is cleared
      const newStats = controller.getCacheStats();
      expect(newStats.totalRequests).toBe(0);
    });

    it('should provide cache statistics', async () => {
      // Load occupation data to generate stats
      await (controller as any).loadOccupationData('17-2051');
      await (controller as any).loadOccupationData('17-2051'); // Cache hit
      await (controller as any).loadOccupationData('25-1011'); // Cache miss
      
      const stats = controller.getCacheStats();
      
      expect(stats).toHaveProperty('memoryEntries');
      expect(stats).toHaveProperty('memoryUsageMB');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('preloadQueue');
      expect(stats).toHaveProperty('stats');
      
      expect(stats.stats.totalRequests).toBeGreaterThan(0);
      expect(stats.stats.hits).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle localStorage unavailable', async () => {
      // Mock localStorage to throw
      const originalLocalStorage = global.localStorage;
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: vi.fn(() => { throw new Error('localStorage unavailable'); }),
          setItem: vi.fn(() => { throw new Error('localStorage unavailable'); }),
          removeItem: vi.fn(() => { throw new Error('localStorage unavailable'); }),
          key: vi.fn(),
          length: 0,
          clear: vi.fn()
        },
        configurable: true,
        writable: true
      });
      
      // Should not throw when creating controller
      expect(() => new OccupationMapController('map')).not.toThrow();
      
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Restore localStorage
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true
      });
    });

    it('should handle malformed cache data', async () => {
      // Set malformed cache data
      localStorage.setItem('sji_webapp_occupation_ids_cache', 'invalid json');
      localStorage.setItem('sji_webapp_occupation_ids_cache_time', 'not a number');
      
      // Should not throw and should fetch from API
      controller = new OccupationMapController('map');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
    });

    it('should handle different API response formats', async () => {
      // Test with array response (legacy format)
      mockApiService.getOccupationIds.mockResolvedValueOnce(mockOccupationIds as any);
      
      controller = new OccupationMapController('map');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
      
      // Verify data is cached correctly
      const cachedData = JSON.parse(localStorage.getItem('sji_webapp_occupation_ids_cache') || 'null');
      expect(cachedData).toEqual(mockOccupationIds);
    });

    it('should handle empty occupation IDs response', async () => {
      mockApiService.getOccupationIds.mockResolvedValue({ occupation_ids: [] });
      
      controller = new OccupationMapController('map');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should handle empty array gracefully
      expect(mockApiService.getOccupationIds).toHaveBeenCalledTimes(1);
      
      const cachedData = JSON.parse(localStorage.getItem('sji_webapp_occupation_ids_cache') || 'null');
      expect(cachedData).toEqual([]);
    });
  });
});
