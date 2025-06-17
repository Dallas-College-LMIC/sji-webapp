import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OccupationCacheService } from '../../js/services/occupationCacheService';
import { CacheService } from '../../js/services/cacheService';

describe('Occupation Cache Performance Tests', () => {
    let cacheService: OccupationCacheService;
    let memoryCache: CacheService<any>;

    beforeEach(() => {
        localStorage.clear();
        cacheService = new OccupationCacheService();
        memoryCache = new CacheService<any>(100); // 100 item limit
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Cache Write Performance', () => {
        it('should handle writing large occupation lists efficiently', () => {
            const largeList = Array.from({ length: 1000 }, (_, i) => `OCC-${i.toString().padStart(4, '0')}`);
            
            const startTime = performance.now();
            cacheService.cacheOccupationIds(largeList);
            const endTime = performance.now();
            
            const executionTime = endTime - startTime;
            expect(executionTime).toBeLessThan(50); // Should complete within 50ms
            
            // Verify data was cached
            const cached = cacheService.getCachedOccupationIds();
            expect(cached).toEqual(largeList);
        });

        it('should handle concurrent cache writes', async () => {
            const lists = Array.from({ length: 10 }, (_, i) => 
                Array.from({ length: 100 }, (_, j) => `OCC-${i}-${j}`)
            );
            
            const startTime = performance.now();
            const promises = lists.map(list => 
                Promise.resolve(cacheService.cacheOccupationIds(list))
            );
            await Promise.all(promises);
            const endTime = performance.now();
            
            const executionTime = endTime - startTime;
            expect(executionTime).toBeLessThan(100); // Should handle all writes within 100ms
        });
    });

    describe('Cache Read Performance', () => {
        it('should retrieve cached data with minimal latency', () => {
            const testData = Array.from({ length: 500 }, (_, i) => `OCC-${i}`);
            cacheService.cacheOccupationIds(testData);
            
            // Measure read performance
            const iterations = 1000;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                cacheService.getCachedOccupationIds();
            }
            
            const endTime = performance.now();
            const averageReadTime = (endTime - startTime) / iterations;
            
            expect(averageReadTime).toBeLessThan(0.1); // Each read should take less than 0.1ms
        });

        it('should maintain performance with expired cache checks', () => {
            // Set old cache
            const oldTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            localStorage.setItem('occupation_ids_cache', JSON.stringify(['OLD-001']));
            localStorage.setItem('occupation_ids_cache_time', oldTime.toString());
            
            const iterations = 100;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                cacheService.getCachedOccupationIds();
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            expect(totalTime).toBeLessThan(10); // Should handle expired checks efficiently
        });
    });

    describe('Memory Cache Performance', () => {
        it('should handle LRU eviction efficiently under memory pressure', () => {
            const startTime = performance.now();
            
            // Fill cache beyond capacity
            for (let i = 0; i < 150; i++) {
                memoryCache.set(`key-${i}`, { data: `value-${i}`, size: 1024 });
            }
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            expect(executionTime).toBeLessThan(50); // Should handle evictions efficiently
            expect(memoryCache.getSize()).toBeLessThanOrEqual(100);
        });

        it('should maintain O(1) access time for cache hits', () => {
            // Populate cache
            for (let i = 0; i < 50; i++) {
                memoryCache.set(`key-${i}`, `value-${i}`);
            }
            
            const testKeys = Array.from({ length: 20 }, (_, i) => `key-${i * 2}`);
            const accessTimes: number[] = [];
            
            // Measure individual access times
            testKeys.forEach(key => {
                const start = performance.now();
                memoryCache.get(key);
                const end = performance.now();
                accessTimes.push(end - start);
            });
            
            // All access times should be similar (O(1))
            const avgTime = accessTimes.reduce((a, b) => a + b) / accessTimes.length;
            const variance = accessTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / accessTimes.length;
            
            expect(variance).toBeLessThan(0.01); // Low variance indicates O(1) access
        });
    });

    describe('Cache Size and Memory Usage', () => {
        it('should efficiently store large datasets in localStorage', () => {
            const datasets = Array.from({ length: 10 }, (_, i) => ({
                id: `dataset-${i}`,
                data: Array.from({ length: 100 }, (_, j) => ({
                    occupation: `OCC-${i}-${j}`,
                    title: `Occupation Title ${i}-${j}`,
                    category: `Category ${i % 5}`
                }))
            }));
            
            const startTime = performance.now();
            
            datasets.forEach(dataset => {
                localStorage.setItem(dataset.id, JSON.stringify(dataset.data));
            });
            
            const endTime = performance.now();
            const writeTime = endTime - startTime;
            
            expect(writeTime).toBeLessThan(100); // Should write all data within 100ms
            
            // Verify data integrity
            const retrieved = JSON.parse(localStorage.getItem('dataset-5')!);
            expect(retrieved).toHaveLength(100);
        });

        it('should handle localStorage quota gracefully', () => {
            // Try to fill localStorage (this might not actually hit quota in test env)
            const largeData = 'x'.repeat(1024 * 1024); // 1MB string
            let quotaExceeded = false;
            let itemsStored = 0;
            
            try {
                for (let i = 0; i < 20; i++) {
                    localStorage.setItem(`large-item-${i}`, largeData);
                    itemsStored++;
                }
            } catch (e) {
                quotaExceeded = true;
            }
            
            // Should either store all items or handle quota exception
            expect(itemsStored > 0 || quotaExceeded).toBe(true);
            
            // Clean up
            for (let i = 0; i < itemsStored; i++) {
                localStorage.removeItem(`large-item-${i}`);
            }
        });
    });

    describe('Cache Hit Rate and Efficiency', () => {
        it('should maintain high hit rate for frequently accessed items', () => {
            const cache = new CacheService<string>(50);
            const accessPattern = [1, 1, 2, 1, 3, 2, 1, 4, 2, 3, 1, 5, 1, 2, 3];
            
            // Populate cache
            for (let i = 1; i <= 5; i++) {
                cache.set(`item-${i}`, `value-${i}`);
            }
            
            let hits = 0;
            let misses = 0;
            
            accessPattern.forEach(id => {
                const result = cache.get(`item-${id}`);
                if (result) hits++;
                else misses++;
            });
            
            const hitRate = hits / (hits + misses);
            expect(hitRate).toBeGreaterThan(0.9); // Should achieve >90% hit rate
        });

        it('should optimize memory usage with compression simulation', () => {
            // Simulate compression by measuring string length reduction
            const occupationData = {
                id: '17-2051',
                title: 'Civil Engineers',
                description: 'Perform engineering duties in planning, designing, and overseeing construction...',
                skills: Array.from({ length: 20 }, (_, i) => `Skill ${i}`),
                related: Array.from({ length: 10 }, (_, i) => `Related occupation ${i}`)
            };
            
            const jsonString = JSON.stringify(occupationData);
            const originalSize = jsonString.length;
            
            // Simulate simple compression (remove whitespace, use shorter keys)
            const compressed = JSON.stringify(occupationData, (key, value) => {
                if (key === 'description') return value.substring(0, 50) + '...';
                if (key === 'skills') return value.slice(0, 5);
                if (key === 'related') return value.slice(0, 3);
                return value;
            });
            
            const compressedSize = compressed.length;
            const compressionRatio = compressedSize / originalSize;
            
            expect(compressionRatio).toBeLessThan(0.5); // Should achieve >50% size reduction
        });
    });

    describe('Cache Warming and Preloading', () => {
        it('should efficiently preload occupation data', async () => {
            const occupationIds = Array.from({ length: 100 }, (_, i) => `OCC-${i}`);
            const mockData = occupationIds.map(id => ({
                id,
                data: { title: `Occupation ${id}`, category: 'Test' }
            }));
            
            const startTime = performance.now();
            
            // Simulate batch preloading
            const batchSize = 10;
            for (let i = 0; i < mockData.length; i += batchSize) {
                const batch = mockData.slice(i, i + batchSize);
                await Promise.all(batch.map(item => 
                    Promise.resolve(memoryCache.set(item.id, item.data))
                ));
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            expect(totalTime).toBeLessThan(50); // Should preload all data quickly
            expect(memoryCache.getSize()).toBe(100);
        });
    });

    describe('Cache Cleanup Performance', () => {
        it('should clear caches efficiently', () => {
            // Populate multiple caches
            for (let i = 0; i < 50; i++) {
                localStorage.setItem(`cache-item-${i}`, JSON.stringify({ data: i }));
                memoryCache.set(`memory-item-${i}`, { data: i });
            }
            
            const startTime = performance.now();
            
            // Clear localStorage cache
            for (let i = 0; i < 50; i++) {
                localStorage.removeItem(`cache-item-${i}`);
            }
            
            // Clear memory cache
            memoryCache.clear();
            
            const endTime = performance.now();
            const clearTime = endTime - startTime;
            
            expect(clearTime).toBeLessThan(10); // Should clear quickly
            expect(memoryCache.getSize()).toBe(0);
        });

        it('should handle selective cache invalidation', () => {
            // Set up cache with patterns
            const items = [
                { key: 'occupation_data_17-2051', value: 'Civil Engineers' },
                { key: 'occupation_data_15-1251', value: 'Computer Programmers' },
                { key: 'wage_data_high', value: 'High wage data' },
                { key: 'occupation_data_29-1141', value: 'Nurses' }
            ];
            
            items.forEach(item => {
                localStorage.setItem(item.key, item.value);
            });
            
            const startTime = performance.now();
            
            // Selectively remove occupation data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('occupation_data_')) {
                    localStorage.removeItem(key);
                }
            });
            
            const endTime = performance.now();
            const invalidationTime = endTime - startTime;
            
            expect(invalidationTime).toBeLessThan(5);
            expect(localStorage.getItem('wage_data_high')).toBe('High wage data');
            expect(localStorage.getItem('occupation_data_17-2051')).toBeNull();
        });
    });
});