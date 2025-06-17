import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OccupationCacheService, type OccupationCacheConfig } from '../../../js/services/occupationCacheService';
import { type ICacheService } from '../../../js/services/cacheService';
import type { GeoJSONResponse } from '../../../types/api';

describe('OccupationCacheService', () => {
  let mockCacheService: ICacheService;
  let occupationCache: OccupationCacheService;
  
  const mockGeoJSONData: GeoJSONResponse = {
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
    // Create mock cache service with spies
    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    };
    
    occupationCache = new OccupationCacheService(mockCacheService);
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const cache = new OccupationCacheService(mockCacheService);
      const debugInfo = cache.getDebugInfo();
      
      expect(debugInfo.config.maxMemoryEntries).toBe(50);
      expect(debugInfo.config.maxMemorySize).toBe(500 * 1024 * 1024);
      expect(debugInfo.config.persistentCacheTTL).toBe(7 * 24 * 60 * 60);
      expect(debugInfo.config.enablePersistence).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<OccupationCacheConfig> = {
        maxMemoryEntries: 100,
        maxMemorySize: 1024 * 1024 * 1024,
        persistentCacheTTL: 24 * 60 * 60,
        enablePersistence: false
      };
      
      const cache = new OccupationCacheService(mockCacheService, customConfig);
      const debugInfo = cache.getDebugInfo();
      
      expect(debugInfo.config.maxMemoryEntries).toBe(100);
      expect(debugInfo.config.maxMemorySize).toBe(1024 * 1024 * 1024);
      expect(debugInfo.config.persistentCacheTTL).toBe(24 * 60 * 60);
      expect(debugInfo.config.enablePersistence).toBe(false);
    });
  });

  describe('get', () => {
    it('should return null for cache miss', async () => {
      const result = await occupationCache.get('17-2051');
      
      expect(result).toBeNull();
      
      const stats = occupationCache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(1);
    });

    it('should return data from memory cache', async () => {
      // First set data in cache
      await occupationCache.set('17-2051', mockGeoJSONData);
      
      // Then get it
      const result = await occupationCache.get('17-2051');
      
      expect(result).toEqual(mockGeoJSONData);
      
      const stats = occupationCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.totalRequests).toBe(1);
    });

    it('should return data from persistent cache and move to memory', async () => {
      // Mock persistent cache to return data
      mockCacheService.get = vi.fn().mockReturnValue(mockGeoJSONData);
      
      const result = await occupationCache.get('17-2051');
      
      expect(result).toEqual(mockGeoJSONData);
      expect(mockCacheService.get).toHaveBeenCalledWith('occupation_17-2051');
      
      const stats = occupationCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.totalRequests).toBe(1);
      
      // Verify data was moved to memory cache
      const debugInfo = occupationCache.getDebugInfo();
      expect(debugInfo.memoryEntries).toBe(1);
    });
  });

  describe('set', () => {
    it('should store data in both memory and persistent cache', async () => {
      await occupationCache.set('17-2051', mockGeoJSONData);
      
      // Verify data is in memory cache
      const result = await occupationCache.get('17-2051');
      expect(result).toEqual(mockGeoJSONData);
      
      // Verify persistent cache was called
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'occupation_17-2051',
        mockGeoJSONData,
        7 * 24 * 60 * 60
      );
      
      const debugInfo = occupationCache.getDebugInfo();
      expect(debugInfo.memoryEntries).toBe(1);
      expect(debugInfo.stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear all caches and reset statistics', async () => {
      // Add some data
      await occupationCache.set('17-2051', mockGeoJSONData);
      await occupationCache.get('17-2051');
      
      // Clear cache
      occupationCache.clear();
      
      // Verify cache is cleared
      const result = await occupationCache.get('17-2051');
      expect(result).toBeNull();
      
      // Verify persistent cache was cleared
      expect(mockCacheService.clear).toHaveBeenCalled();
    });
  });

  describe('statistics and debugging', () => {
    it('should track cache statistics correctly', async () => {
      // Test hits
      await occupationCache.set('17-2051', mockGeoJSONData);
      await occupationCache.get('17-2051');
      
      // Test misses
      await occupationCache.get('nonexistent');
      
      const stats = occupationCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should provide comprehensive debug information', async () => {
      await occupationCache.set('17-2051', mockGeoJSONData);
      
      const debugInfo = occupationCache.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('memoryEntries');
      expect(debugInfo).toHaveProperty('memoryUsageMB');
      expect(debugInfo).toHaveProperty('hitRate');
      expect(debugInfo).toHaveProperty('config');
      expect(debugInfo).toHaveProperty('stats');
      
      expect(debugInfo.memoryEntries).toBe(1);
      expect(debugInfo.stats.memoryUsage).toBeGreaterThan(0);
      expect(debugInfo.hitRate).toBe(0); // No gets yet
    });
  });
});