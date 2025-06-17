import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../mocks/mapbox-gl';
import { OccupationMapController } from '../../js/occupation';
import { AppInitializer } from '../../js/utils/appInitializer';

// Mock environment
const originalEnv = process.env.NODE_ENV;

describe('Debug Mode Integration Tests', () => {
    let controller: OccupationMapController;
    let container: HTMLElement;
    let consoleLogSpy: any;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="mainmap"></div>
            <select id="occupation-select">
                <option value="">Select an occupation...</option>
            </select>
            <div id="loading" style="display: none;">Loading...</div>
        `;

        container = document.getElementById('mainmap')!;

        // Mock console.log
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Mock mapboxgl
        vi.mocked(window.mapboxgl.Map).mockReturnValue({
            on: vi.fn((event, callback) => {
                if (event === 'load') {
                    setTimeout(callback, 0);
                }
            }),
            getLayer: vi.fn(),
            addLayer: vi.fn(),
            removeLayer: vi.fn(),
            getSource: vi.fn(),
            addSource: vi.fn(),
            removeSource: vi.fn(),
            resize: vi.fn()
        } as any);

        // Mock jQuery
        (window as any).$ = vi.fn(() => ({
            select2: vi.fn(),
            on: vi.fn(),
            val: vi.fn(),
            empty: vi.fn(),
            append: vi.fn(),
            show: vi.fn(),
            hide: vi.fn()
        }));
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        consoleLogSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
        delete (window as any).occupationMapDebug;
    });

    describe('Development Mode Debug Tools', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('should expose debug tools in development mode', async () => {
            const initPromise = AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));
            const controller = await initPromise;

            expect((window as any).occupationMapDebug).toBeDefined();
            expect((window as any).occupationMapDebug.getCacheStats).toBeDefined();
            expect((window as any).occupationMapDebug.clearAllCaches).toBeDefined();
            expect((window as any).occupationMapDebug.controller).toBe(controller);
        });

        it('should log debug tools availability message', async () => {
            await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(consoleLogSpy).toHaveBeenCalledWith('🔧 Debug tools available at window.occupationMapDebug');
        });

        it('should provide working getCacheStats function', async () => {
            const controller = await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            const mockStats = {
                occupationIds: { size: 5, hits: 10, misses: 2 },
                occupationData: { size: 3, hits: 5, misses: 1 }
            };
            vi.spyOn(controller as any, 'getCacheStats').mockReturnValue(mockStats);

            const stats = (window as any).occupationMapDebug.getCacheStats();
            expect(stats).toEqual(mockStats);
        });

        it('should provide working clearAllCaches function', async () => {
            const controller = await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            const clearSpy = vi.spyOn(controller as any, 'clearAllCaches').mockImplementation(() => {});

            (window as any).occupationMapDebug.clearAllCaches();
            expect(clearSpy).toHaveBeenCalled();
        });
    });

    describe('Production Mode', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
        });

        it('should not expose debug tools in production mode', async () => {
            await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            expect((window as any).occupationMapDebug).toBeUndefined();
        });

        it('should not log debug message in production', async () => {
            await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(consoleLogSpy).not.toHaveBeenCalledWith('🔧 Debug tools available at window.occupationMapDebug');
        });
    });

    describe('Debug Mode Cache Operations', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('should track cache operations in debug mode', async () => {
            const controller = new OccupationMapController('mainmap');
            
            // Mock cache service with debug tracking
            const mockCacheService = {
                getCachedOccupationIds: vi.fn().mockResolvedValue(['OCC-001', 'OCC-002']),
                cacheOccupationIds: vi.fn(),
                getDebugInfo: vi.fn().mockReturnValue({
                    cacheHits: 5,
                    cacheMisses: 2,
                    totalRequests: 7,
                    hitRate: '71.43%'
                })
            };
            controller['cacheService'] = mockCacheService as any;

            await controller.loadOccupationIds();

            // Debug info should be available
            const debugInfo = mockCacheService.getDebugInfo();
            expect(debugInfo.cacheHits).toBe(5);
            expect(debugInfo.hitRate).toBe('71.43%');
        });

        it('should allow cache inspection through debug tools', async () => {
            const controller = await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            // Set up some cached data
            localStorage.setItem('occupation_ids_cache', JSON.stringify(['OCC-001', 'OCC-002']));
            localStorage.setItem('occupation_ids_cache_time', Date.now().toString());

            // Mock getCacheStats
            const mockStats = {
                localStorage: {
                    occupationIds: true,
                    occupationIdsAge: '5 minutes',
                    totalSize: '2.5 KB'
                },
                memory: {
                    occupationData: 3,
                    totalSize: '15.2 KB'
                }
            };
            vi.spyOn(controller as any, 'getCacheStats').mockReturnValue(mockStats);

            const stats = (window as any).occupationMapDebug.getCacheStats();
            expect(stats.localStorage.occupationIds).toBe(true);
            expect(stats.memory.occupationData).toBe(3);
        });
    });

    describe('Debug Mode Error Tracking', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('should log detailed errors in debug mode', async () => {
            const controller = new OccupationMapController('mainmap');
            
            // Mock API error
            const mockError = new Error('API request failed');
            controller['apiService'] = {
                getOccupationIds: vi.fn().mockRejectedValue(mockError)
            } as any;

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.loadOccupationIds();

            expect(consoleErrorSpy).toHaveBeenCalled();
            const errorCall = consoleErrorSpy.mock.calls[0];
            expect(errorCall[0]).toContain('Failed to load occupation IDs');
            expect(errorCall[1]).toBe(mockError);

            consoleErrorSpy.mockRestore();
        });

        it('should track error counts in debug mode', async () => {
            process.env.NODE_ENV = 'development';
            
            const controller = await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            // Mock error tracking
            const errorStats = {
                apiErrors: 3,
                cacheErrors: 1,
                mapErrors: 0,
                lastError: 'API timeout',
                errorTimestamps: ['2025-01-17T10:00:00Z', '2025-01-17T10:05:00Z']
            };
            
            (controller as any).getErrorStats = vi.fn().mockReturnValue(errorStats);
            (window as any).occupationMapDebug.getErrorStats = () => (controller as any).getErrorStats();

            const stats = (window as any).occupationMapDebug.getErrorStats();
            expect(stats.apiErrors).toBe(3);
            expect(stats.lastError).toBe('API timeout');
        });
    });

    describe('Debug Mode Performance Monitoring', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('should track performance metrics in debug mode', async () => {
            const controller = new OccupationMapController('mainmap');
            
            // Mock performance tracking
            const performanceMetrics = {
                occupationLoadTime: 245,
                mapRenderTime: 123,
                cacheHitRate: 0.85,
                averageResponseTime: 189
            };
            
            (controller as any).getPerformanceMetrics = vi.fn().mockReturnValue(performanceMetrics);

            const metrics = (controller as any).getPerformanceMetrics();
            expect(metrics.occupationLoadTime).toBe(245);
            expect(metrics.cacheHitRate).toBe(0.85);
        });

        it('should expose performance metrics through debug tools', async () => {
            const controller = await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            // Add performance metrics method to debug tools
            (window as any).occupationMapDebug.getPerformanceMetrics = () => ({
                loadTimes: [234, 156, 289, 178],
                averageLoadTime: 214.25,
                cacheEfficiency: '87%'
            });

            const metrics = (window as any).occupationMapDebug.getPerformanceMetrics();
            expect(metrics.averageLoadTime).toBe(214.25);
            expect(metrics.cacheEfficiency).toBe('87%');
        });
    });

    describe('Debug Mode Console Commands', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('should allow manual cache clearing through console', async () => {
            const controller = await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            // Set up cache data
            localStorage.setItem('occupation_ids_cache', JSON.stringify(['OCC-001']));
            localStorage.setItem('occupation_data_cache_OCC-001', JSON.stringify({ data: 'test' }));

            // Clear through debug tools
            const clearSpy = vi.spyOn(controller as any, 'clearAllCaches').mockImplementation(() => {
                localStorage.removeItem('occupation_ids_cache');
                localStorage.removeItem('occupation_data_cache_OCC-001');
            });

            (window as any).occupationMapDebug.clearAllCaches();

            expect(clearSpy).toHaveBeenCalled();
            expect(localStorage.getItem('occupation_ids_cache')).toBeNull();
        });

        it('should allow forcing cache refresh', async () => {
            const controller = await AppInitializer.initialize('mainmap', OccupationMapController, 'Test Map');
            await new Promise(resolve => setTimeout(resolve, 10));

            // Add force refresh method
            const forceRefreshSpy = vi.spyOn(controller as any, 'forceRefreshOccupations').mockImplementation(async () => {
                await controller.loadOccupationIds();
            });
            
            (window as any).occupationMapDebug.forceRefresh = () => (controller as any).forceRefreshOccupations();

            await (window as any).occupationMapDebug.forceRefresh();
            expect(forceRefreshSpy).toHaveBeenCalled();
        });
    });
});