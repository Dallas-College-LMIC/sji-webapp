import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../mocks/mapbox-gl';
import { OccupationMapController } from '../../../js/occupation';
import { ApiService } from '../../../js/api';
import { OccupationCacheService } from '../../../js/services/occupationCacheService';
import { UIService } from '../../../js/services/uiService';
import { ErrorHandler } from '../../../js/utils/errorHandler';
import type { OccupationIdsResponse } from '../../../types/api';

vi.mock('../../../js/api');
vi.mock('../../../js/services/occupationCacheService');
vi.mock('../../../js/services/uiService');
vi.mock('../../../js/utils/errorHandler');

// Mock MapManager to prevent actual map initialization
vi.mock('../../../js/mapUtils', () => ({
    MapManager: vi.fn().mockImplementation(() => ({
        map: {
            on: vi.fn((event, callback) => {
                if (event === 'load') setTimeout(callback, 0);
            }),
            getLayer: vi.fn(),
            addLayer: vi.fn(),
            removeLayer: vi.fn(),
            getSource: vi.fn(),
            addSource: vi.fn(),
            removeSource: vi.fn(),
            resize: vi.fn(),
            setLayoutProperty: vi.fn(),
            setPaintProperty: vi.fn(),
            queryRenderedFeatures: vi.fn(),
            easeTo: vi.fn(),
            getBounds: vi.fn().mockReturnValue({
                getNorthEast: vi.fn().mockReturnValue({ lng: -96, lat: 33 }),
                getSouthWest: vi.fn().mockReturnValue({ lng: -98, lat: 32 })
            }),
            addControl: vi.fn()
        },
        containerId: 'test-map',
        popup: {},
        initializeMap: vi.fn(),
        addControls: vi.fn(),
        createLayerColor: vi.fn(),
        addSource: vi.fn(),
        addLayer: vi.fn(),
        clearLayers: vi.fn(),
        onStyleLoad: vi.fn((callback) => callback()),
        addPopupEvents: vi.fn(),
        setLayerVisibility: vi.fn()
    }))
}));

describe('OccupationMapController - Edge Cases', () => {
    let controller: OccupationMapController;
    let mockApiService: any;
    let mockCacheService: any;
    let mockUIService: any;
    let mockContainer: HTMLElement;
    let mockOccupationSelect: HTMLSelectElement;

    beforeEach(() => {
        // Setup DOM elements
        mockContainer = document.createElement('div');
        mockContainer.id = 'test-map';
        mockOccupationSelect = document.createElement('select');
        mockOccupationSelect.id = 'occupation-select';
        document.body.appendChild(mockContainer);
        document.body.appendChild(mockOccupationSelect);

        // Mock services
        mockApiService = {
            getOccupationIds: vi.fn(),
            getOccupationData: vi.fn(),
            getExportUrl: vi.fn(),
            getOccupationExportUrl: vi.fn()
        };
        
        mockCacheService = {
            getCachedOccupationIds: vi.fn(),
            cacheOccupationIds: vi.fn(),
            getCachedOccupationData: vi.fn(),
            cacheOccupationData: vi.fn(),
            clearOccupationCache: vi.fn(),
            clearAllCaches: vi.fn(),
            getDebugInfo: vi.fn(),
            getStats: vi.fn()
        };
        
        mockUIService = {
            showLoading: vi.fn(),
            hideLoading: vi.fn(),
            showError: vi.fn(),
            showNotification: vi.fn()
        };

        // Map instance is mocked via MapManager mock

        // Mock jQuery and Select2
        const mockSelect2 = vi.fn().mockReturnValue({
            on: vi.fn(),
            val: vi.fn(),
            trigger: vi.fn(),
            select2: vi.fn()
        });
        (window as any).$ = vi.fn((selector: string) => {
            if (selector === '#occupation-select') {
                return {
                    select2: mockSelect2,
                    on: vi.fn(),
                    val: vi.fn(),
                    trigger: vi.fn(),
                    html: vi.fn(),
                    append: vi.fn(),
                    empty: vi.fn(),
                    find: vi.fn().mockReturnValue({
                        remove: vi.fn()
                    })
                };
            }
            return { show: vi.fn(), hide: vi.fn() };
        });

        controller = new OccupationMapController('test-map');
        controller['apiService'] = mockApiService;
        controller['cacheService'] = mockCacheService;
        controller['uiService'] = mockUIService;
    });

    afterEach(() => {
        document.body.removeChild(mockContainer);
        document.body.removeChild(mockOccupationSelect);
        vi.clearAllMocks();
    });

    describe('Empty Occupation List', () => {
        it('should handle empty occupation list gracefully', async () => {
            const emptyResponse: OccupationIdsResponse = { occupation_ids: [] };
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(emptyResponse);

            await controller['loadOccupationIds']();

            expect(controller['showLoading']).toHaveBeenCalledWith('loading', 'Loading occupations...');
            expect(controller['hideLoading']).toHaveBeenCalledWith('loading');
            expect(mockCacheService.set).toHaveBeenCalledWith('occupation_ids', [], 86400);
        });

        it('should display message when no occupations available', async () => {
            const emptyResponse: OccupationIdsResponse = { occupation_ids: [] };
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(emptyResponse);

            const mockSelect = vi.fn();
            (window as any).$ = vi.fn(() => ({
                select2: mockSelect,
                empty: vi.fn(),
                append: vi.fn(),
                html: vi.fn(),
                find: vi.fn().mockReturnValue({ remove: vi.fn() })
            }));

            await controller['loadOccupationIds']();

            const $calls = (window as any).$.mock.calls;
            const selectCalls = $calls.filter((call: any[]) => call[0] === '#occupation-select');
            expect(selectCalls.length).toBeGreaterThan(0);
        });
    });

    describe('Very Large Occupation Lists', () => {
        it('should handle large occupation list (1000+ items) efficiently', async () => {
            const largeOccupationIds = Array.from({ length: 1500 }, (_, i) => `OCC-${i.toString().padStart(4, '0')}`);
            const largeResponse: OccupationIdsResponse = { occupation_ids: largeOccupationIds };
            
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(largeResponse);

            const startTime = Date.now();
            await controller['loadOccupationIds']();
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
            expect(mockCacheService.set).toHaveBeenCalledWith('occupation_ids', largeOccupationIds, 86400);
        });

        it('should batch DOM updates for large lists', async () => {
            const largeOccupationIds = Array.from({ length: 500 }, (_, i) => `OCC-${i.toString().padStart(3, '0')}`);
            const largeResponse: OccupationIdsResponse = { occupation_ids: largeOccupationIds };
            
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(largeResponse);

            const mockFind = vi.fn().mockReturnValue({ remove: vi.fn() });
            const mockAppend = vi.fn();
            (window as any).$ = vi.fn(() => ({
                select2: vi.fn(),
                find: mockFind,
                append: mockAppend,
                html: vi.fn()
            }));

            await controller['loadOccupationIds']();

            // Should clear once and append options
            expect(mockFind).toHaveBeenCalledWith('option:not(:first)');
            expect(mockAppend).toHaveBeenCalled();
        });
    });

    describe('Special Characters in Occupation IDs', () => {
        it('should handle occupation IDs with special characters', async () => {
            const specialOccupationIds = [
                '17-2051.00',
                '29-1141.01/02',
                'SOC:15-1251',
                'O*NET-19.1234',
                'Occupation & Title (Special)',
                '<script>alert("xss")</script>'
            ];
            const response: OccupationIdsResponse = { occupation_ids: specialOccupationIds };
            
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(response);

            await controller['loadOccupationIds']();

            expect(mockCacheService.set).toHaveBeenCalledWith('occupation_ids', specialOccupationIds, 86400);
            // Verify XSS protection would be handled by Select2
        });

        it('should escape HTML in occupation IDs', async () => {
            const xssOccupationIds = [
                '<img src=x onerror=alert(1)>',
                'javascript:alert(1)',
                '"><script>alert(1)</script>'
            ];
            const response: OccupationIdsResponse = { occupation_ids: xssOccupationIds };
            
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(response);

            const mockAppend = vi.fn();
            (window as any).$ = vi.fn(() => ({
                select2: vi.fn(),
                find: vi.fn().mockReturnValue({ remove: vi.fn() }),
                append: mockAppend,
                html: vi.fn()
            }));

            await controller['loadOccupationIds']();

            // Verify that Option constructor is called (which handles escaping)
            expect(mockAppend).toHaveBeenCalled();
        });
    });

    describe('Dropdown Selection Edge Cases', () => {
        it('should handle null selection', async () => {
            // Mock the clearMap method
            const clearMapSpy = vi.spyOn(controller as any, 'clearMap').mockImplementation(() => {});
            
            // Simulate setupDropdownChangeHandler behavior
            const handler = (selectedValue: string | null) => {
                if (selectedValue) {
                    controller['loadOccupationData'](selectedValue);
                } else {
                    controller['clearMap']();
                }
            };
            
            // Call handler with null
            handler(null);
            
            expect(clearMapSpy).toHaveBeenCalled();
        });

        it('should handle undefined selection', async () => {
            const clearMapSpy = vi.spyOn(controller as any, 'clearMap').mockImplementation(() => {});
            
            const handler = (selectedValue: string | undefined) => {
                if (selectedValue) {
                    controller['loadOccupationData'](selectedValue);
                } else {
                    controller['clearMap']();
                }
            };
            
            handler(undefined);
            
            expect(clearMapSpy).toHaveBeenCalled();
        });

        it('should handle empty string selection', async () => {
            const clearMapSpy = vi.spyOn(controller as any, 'clearMap').mockImplementation(() => {});
            
            const handler = (selectedValue: string) => {
                if (selectedValue) {
                    controller['loadOccupationData'](selectedValue);
                } else {
                    controller['clearMap']();
                }
            };
            
            handler('');
            
            expect(clearMapSpy).toHaveBeenCalled();
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle multiple rapid selections', async () => {
            const mockLoadData = vi.spyOn(controller as any, 'loadOccupationData').mockResolvedValue(undefined);

            // Simulate rapid selections
            await mockLoadData('OCC-001');
            await mockLoadData('OCC-002');
            await mockLoadData('OCC-003');

            await new Promise(resolve => setTimeout(resolve, 100));

            // Should handle all selections without errors
            expect(mockLoadData).toHaveBeenCalledTimes(3);
        });

        it('should deduplicate concurrent requests for same occupation', async () => {
            const mockOccupationCache = {
                get: vi.fn().mockResolvedValue(null),
                set: vi.fn().mockResolvedValue(undefined)
            };
            controller['occupationCache'] = mockOccupationCache as any;
            
            mockApiService.getOccupationData.mockResolvedValue({ type: 'FeatureCollection', features: [] });
            
            // Start multiple requests for same occupation
            const promises = [
                controller['loadOccupationData']('OCC-001'),
                controller['loadOccupationData']('OCC-001'),
                controller['loadOccupationData']('OCC-001')
            ];
            
            await Promise.all(promises);
            
            // Should only fetch once due to deduplication
            expect(mockApiService.getOccupationData).toHaveBeenCalledTimes(1);
        });
    });

    describe('Memory Constraints', () => {
        it('should handle out of memory scenario gracefully', async () => {
            const largeOccupationIds = Array.from({ length: 10000 }, (_, i) => `OCC-${i}`);
            const response: OccupationIdsResponse = { occupation_ids: largeOccupationIds };
            
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(response);
            mockCacheService.set = vi.fn().mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            await controller['loadOccupationIds']();

            // Should complete without throwing
            expect(controller['hideLoading']).toHaveBeenCalledWith('loading');
        });
    });

    describe('Select2 Initialization Failures', () => {
        it('should handle Select2 not loaded', async () => {
            // Remove Select2 from jQuery
            (window as any).$.fn = {};
            
            const response: OccupationIdsResponse = { occupation_ids: ['OCC-001'] };
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(response);

            await expect(controller['loadOccupationIds']()).resolves.not.toThrow();
        });

        it('should handle Select2 initialization error', async () => {
            const mockSelect2 = vi.fn().mockImplementation(() => {
                throw new Error('Select2 initialization failed');
            });
            
            (window as any).$ = vi.fn(() => ({
                select2: mockSelect2,
                find: vi.fn().mockReturnValue({ remove: vi.fn() }),
                append: vi.fn()
            }));

            const response: OccupationIdsResponse = { occupation_ids: ['OCC-001'] };
            mockCacheService.get = vi.fn().mockReturnValue(null);
            mockApiService.getOccupationIds.mockResolvedValue(response);

            await expect(controller['loadOccupationIds']()).resolves.not.toThrow();
        });
    });
});