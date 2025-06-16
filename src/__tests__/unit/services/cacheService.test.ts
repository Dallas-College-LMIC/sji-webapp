import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageCacheService, createCacheService } from '../../../js/services/cacheService';
import { createMockLocalStorage } from '../../utils/testHelpers';

describe('CacheService', () => {
  let cacheService: LocalStorageCacheService;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    global.localStorage = mockLocalStorage;
    cacheService = new LocalStorageCacheService('test');
  });

  describe('LocalStorageCacheService', () => {
    describe('get', () => {
      it('should return null for non-existent key', () => {
        const result = cacheService.get('nonexistent');
        expect(result).toBeNull();
      });

      it('should return cached value for existing key', () => {
        const testData = { foo: 'bar' };
        const cacheKey = 'test_mykey_cache';
        const cacheTimeKey = 'test_mykey_cache_time';
        
        // Mock localStorage to return our test data
        mockLocalStorage.getItem = vi.fn((key) => {
          if (key === cacheKey) return JSON.stringify(testData);
          if (key === cacheTimeKey) return (Date.now() + 3600000).toString(); // 1 hour from now
          return null;
        });

        const result = cacheService.get('mykey');
        expect(result).toEqual(testData);
      });

      it('should return null for expired cache', () => {
        const testData = { foo: 'bar' };
        const cacheKey = 'test_mykey_cache';
        const cacheTimeKey = 'test_mykey_cache_time';
        
        // Mock localStorage to return expired data
        mockLocalStorage.getItem = vi.fn((key) => {
          if (key === cacheKey) return JSON.stringify(testData);
          if (key === cacheTimeKey) return (Date.now() - 2 * 60 * 60 * 1000).toString(); // 2 hours ago
          return null;
        });

        // TTL is 1 hour by default
        const result = cacheService.get('mykey');
        expect(result).toBeNull();
      });

      it('should handle invalid JSON gracefully', () => {
        const cacheKey = 'test_mykey_cache';
        const cacheTimeKey = 'test_mykey_cache_time';
        
        // Mock localStorage to return invalid JSON
        mockLocalStorage.getItem = vi.fn((key) => {
          if (key === cacheKey) return 'invalid json';
          if (key === cacheTimeKey) return (Date.now() + 3600000).toString();
          return null;
        });

        const result = cacheService.get('mykey');
        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should store value with default TTL', () => {
        const testData = { foo: 'bar' };
        cacheService.set('mykey', testData);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'test_mykey_cache',
          JSON.stringify(testData)
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'test_mykey_cache_time',
          expect.any(String)
        );
      });

      it('should store value with custom TTL', () => {
        const testData = { foo: 'bar' };
        cacheService.set('mykey', testData, 7200); // 2 hours

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'test_mykey_cache',
          JSON.stringify(testData)
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'test_mykey_cache_time',
          expect.any(String)
        );
      });

      it('should handle localStorage errors gracefully', () => {
        const testData = { foo: 'bar' };
        vi.mocked(mockLocalStorage.setItem).mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        // Should not throw
        expect(() => cacheService.set('mykey', testData)).not.toThrow();
      });
    });

    describe('remove', () => {
      it('should remove cached value and time', () => {
        cacheService.remove('mykey');

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_mykey_cache');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_mykey_cache_time');
      });
    });

    describe('clear', () => {
      it('should clear all cache entries with prefix', () => {
        // Setup some cache entries
        mockLocalStorage.setItem('test_key1', 'value1');
        mockLocalStorage.setItem('test_key1_time', new Date().toISOString());
        mockLocalStorage.setItem('test_key2', 'value2');
        mockLocalStorage.setItem('test_key2_time', new Date().toISOString());
        mockLocalStorage.setItem('other_key', 'should not be removed');
        
        // Mock localStorage.key() to return our test keys
        let keys = ['test_key1', 'test_key1_time', 'test_key2', 'test_key2_time', 'other_key'];
        vi.mocked(mockLocalStorage.key).mockImplementation((index: number) => keys[index] || null);
        Object.defineProperty(mockLocalStorage, 'length', { get: () => keys.length });

        cacheService.clear();

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key1');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key1_time');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key2');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key2_time');
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key');
      });
    });
  });

  describe('createCacheService', () => {
    it('should create LocalStorageCacheService for localStorage type', () => {
      const service = createCacheService('localStorage', 'test');
      expect(service).toBeInstanceOf(LocalStorageCacheService);
    });

    it('should create LocalStorageCacheService by default', () => {
      const service = createCacheService();
      expect(service).toBeInstanceOf(LocalStorageCacheService);
    });

    it('should throw error for unsupported cache type', () => {
      expect(() => createCacheService('unsupported' as any)).toThrow(
        'Unknown cache service type: unsupported'
      );
    });
  });
});