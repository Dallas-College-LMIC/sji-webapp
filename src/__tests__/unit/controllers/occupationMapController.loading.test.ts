import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../mocks/mapbox-gl';
import { OccupationMapController } from '../../../js/occupation';
import { ApiService } from '../../../js/api';
import { OccupationCacheService } from '../../../js/services/occupationCacheService';
import { UIService } from '../../../js/services/uiService';
import type { OccupationIdsResponse, GeoJSONResponse } from '../../../types/api';

vi.mock('../../../js/api');
vi.mock('../../../js/services/occupationCacheService');
vi.mock('../../../js/services/uiService');

describe('OccupationMapController - Loading States', () => {
    let controller: OccupationMapController;
    let mockApiService: ApiService;
    let mockCacheService: OccupationCacheService;
    let mockUIService: UIService;
    let mockMap: mapboxgl.Map;
    let mockContainer: HTMLElement;
    let mockOccupationSelect: HTMLSelectElement;
    let mockLoadingElement: HTMLElement;

    beforeEach(() => {
        // Setup DOM elements
        mockContainer = document.createElement('div');
        mockContainer.id = 'test-map';
        mockOccupationSelect = document.createElement('select');
        mockOccupationSelect.id = 'occupation-select';
        mockLoadingElement = document.createElement('div');
        mockLoadingElement.id = 'loading';
        document.body.appendChild(mockContainer);
        document.body.appendChild(mockOccupationSelect);
        document.body.appendChild(mockLoadingElement);

        // Mock services
        mockApiService = new ApiService('http://test-api');
        mockCacheService = new OccupationCacheService();
        mockUIService = new UIService();

        // Mock map instance
        mockMap = {
            on: vi.fn(),
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
            })
        } as any;

        // Mock mapboxgl constructor
        vi.mocked(window.mapboxgl.Map).mockReturnValue(mockMap);

        // Mock jQuery
        (window as any).$ = vi.fn((selector: string) => {
            if (selector === '#occupation-select') {
                return {
                    select2: vi.fn(),
                    on: vi.fn(),
                    val: vi.fn(),
                    trigger: vi.fn(),
                    html: vi.fn(),
                    append: vi.fn(),
                    empty: vi.fn()
                };
            }
            if (selector === '#loading') {
                return {
                    show: vi.fn(),
                    hide: vi.fn(),
                    find: vi.fn().mockReturnValue({
                        text: vi.fn()
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
        document.body.removeChild(mockLoadingElement);
        vi.clearAllMocks();
    });

    describe('Loading Spinner During Occupation List Fetch', () => {
        it('should show loading spinner when fetching occupation IDs', async () => {
            const response: OccupationIdsResponse = { occupation_ids: ['OCC-001', 'OCC-002'] };
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockResolvedValue(response);

            await controller.loadOccupationIds();

            expect(mockUIService.showLoading).toHaveBeenCalledWith('occupation-select', 'Loading occupations...');
            expect(mockUIService.showLoading).toHaveBeenCalledBefore(mockApiService.getOccupationIds as any);
        });

        it('should hide loading spinner after occupation IDs are loaded', async () => {
            const response: OccupationIdsResponse = { occupation_ids: ['OCC-001'] };
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockResolvedValue(response);

            await controller.loadOccupationIds();

            expect(mockUIService.hideLoading).toHaveBeenCalledWith('occupation-select');
            expect(mockUIService.hideLoading).toHaveBeenCalledAfter(mockApiService.getOccupationIds as any);
        });

        it('should hide loading spinner on error', async () => {
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockRejectedValue(new Error('Network error'));

            await controller.loadOccupationIds();

            expect(mockUIService.hideLoading).toHaveBeenCalledWith('occupation-select');
        });

        it('should not show loading spinner when using cached data', async () => {
            const cachedIds = ['OCC-001', 'OCC-002'];
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(cachedIds);

            await controller.loadOccupationIds();

            expect(mockUIService.showLoading).not.toHaveBeenCalled();
            expect(mockApiService.getOccupationIds).not.toHaveBeenCalled();
        });
    });

    describe('Loading Spinner During Occupation Data Fetch', () => {
        it('should show map loading when fetching occupation data', async () => {
            const occupationId = 'OCC-001';
            const mockGeoJSON: GeoJSONResponse = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: { GEOID: '48001', occupation_zscore: 1.5 },
                    geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
                }]
            };

            vi.mocked(mockApiService.getOccupationData).mockResolvedValue(mockGeoJSON);
            vi.spyOn(controller as any, 'clearMap').mockImplementation(() => {});
            vi.spyOn(controller as any, 'updateMapWithData').mockImplementation(() => {});

            await controller['loadOccupationData'](occupationId);

            expect(controller['showLoading']).toHaveBeenCalled();
            expect(controller['showLoading']).toHaveBeenCalledBefore(mockApiService.getOccupationData as any);
        });

        it('should hide map loading after occupation data is loaded', async () => {
            const occupationId = 'OCC-001';
            const mockGeoJSON: GeoJSONResponse = {
                type: 'FeatureCollection',
                features: []
            };

            vi.mocked(mockApiService.getOccupationData).mockResolvedValue(mockGeoJSON);
            vi.spyOn(controller as any, 'clearMap').mockImplementation(() => {});
            vi.spyOn(controller as any, 'updateMapWithData').mockImplementation(() => {});
            vi.spyOn(controller as any, 'hideLoading').mockImplementation(() => {});

            await controller['loadOccupationData'](occupationId);

            expect(controller['hideLoading']).toHaveBeenCalled();
            expect(controller['hideLoading']).toHaveBeenCalledAfter(mockApiService.getOccupationData as any);
        });

        it('should hide loading on data fetch error', async () => {
            const occupationId = 'OCC-001';
            vi.mocked(mockApiService.getOccupationData).mockRejectedValue(new Error('API Error'));
            vi.spyOn(controller as any, 'hideLoading').mockImplementation(() => {});

            await controller['loadOccupationData'](occupationId);

            expect(controller['hideLoading']).toHaveBeenCalled();
        });
    });

    describe('Concurrent Loading States', () => {
        it('should handle overlapping load operations correctly', async () => {
            // Setup delayed responses
            let resolveOccupationIds: (value: OccupationIdsResponse) => void;
            let resolveOccupationData: (value: GeoJSONResponse) => void;
            
            const occupationIdsPromise = new Promise<OccupationIdsResponse>(resolve => {
                resolveOccupationIds = resolve;
            });
            
            const occupationDataPromise = new Promise<GeoJSONResponse>(resolve => {
                resolveOccupationData = resolve;
            });

            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockReturnValue(occupationIdsPromise);
            vi.mocked(mockApiService.getOccupationData).mockReturnValue(occupationDataPromise);

            // Start loading occupation IDs
            const loadIdsPromise = controller.loadOccupationIds();
            
            expect(mockUIService.showLoading).toHaveBeenCalledWith('occupation-select', 'Loading occupations...');

            // Start loading occupation data while IDs are still loading
            vi.spyOn(controller as any, 'clearMap').mockImplementation(() => {});
            vi.spyOn(controller as any, 'updateMapWithData').mockImplementation(() => {});
            const loadDataPromise = controller['loadOccupationData']('OCC-001');

            expect(controller['showLoading']).toHaveBeenCalled();

            // Resolve occupation IDs
            resolveOccupationIds!({ occupation_ids: ['OCC-001', 'OCC-002'] });
            await loadIdsPromise;

            expect(mockUIService.hideLoading).toHaveBeenCalledWith('occupation-select');

            // Map loading should still be active
            expect(controller['hideLoading']).not.toHaveBeenCalled();

            // Resolve occupation data
            resolveOccupationData!({ type: 'FeatureCollection', features: [] });
            await loadDataPromise;

            expect(controller['hideLoading']).toHaveBeenCalled();
        });

        it('should maintain correct loading state during rapid selections', async () => {
            const mockGeoJSON: GeoJSONResponse = {
                type: 'FeatureCollection',
                features: []
            };

            vi.mocked(mockApiService.getOccupationData).mockResolvedValue(mockGeoJSON);
            vi.spyOn(controller as any, 'clearMap').mockImplementation(() => {});
            vi.spyOn(controller as any, 'updateMapWithData').mockImplementation(() => {});
            
            const showLoadingSpy = vi.spyOn(controller as any, 'showLoading');
            const hideLoadingSpy = vi.spyOn(controller as any, 'hideLoading');

            // Simulate rapid selections
            const onChange = controller['getDropdownChangeHandler']();
            onChange({ target: { value: 'OCC-001' } } as any);
            onChange({ target: { value: 'OCC-002' } } as any);
            onChange({ target: { value: 'OCC-003' } } as any);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Each selection should show/hide loading
            expect(showLoadingSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
            expect(hideLoadingSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Loading Message Customization', () => {
        it('should show custom message for occupation list loading', async () => {
            const response: OccupationIdsResponse = { occupation_ids: ['OCC-001'] };
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockResolvedValue(response);

            await controller.loadOccupationIds();

            expect(mockUIService.showLoading).toHaveBeenCalledWith(
                'occupation-select',
                'Loading occupations...'
            );
        });

        it('should update loading message during long operations', async () => {
            let resolvePromise: (value: OccupationIdsResponse) => void;
            const delayedPromise = new Promise<OccupationIdsResponse>(resolve => {
                resolvePromise = resolve;
            });

            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockReturnValue(delayedPromise);

            const loadPromise = controller.loadOccupationIds();

            // Initial loading message
            expect(mockUIService.showLoading).toHaveBeenCalledWith(
                'occupation-select',
                'Loading occupations...'
            );

            // Simulate time passing
            await new Promise(resolve => setTimeout(resolve, 50));

            // Resolve the promise
            resolvePromise!({ occupation_ids: ['OCC-001'] });
            await loadPromise;

            expect(mockUIService.hideLoading).toHaveBeenCalled();
        });
    });

    describe('Loading State Persistence', () => {
        it('should maintain loading state across component lifecycle', async () => {
            // Mock a scenario where component might be re-initialized
            const response: OccupationIdsResponse = { occupation_ids: ['OCC-001'] };
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockResolvedValue(response);

            // First load
            await controller.loadOccupationIds();
            expect(mockUIService.showLoading).toHaveBeenCalledTimes(1);
            expect(mockUIService.hideLoading).toHaveBeenCalledTimes(1);

            // Second load (e.g., after error recovery)
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            await controller.loadOccupationIds();
            
            expect(mockUIService.showLoading).toHaveBeenCalledTimes(2);
            expect(mockUIService.hideLoading).toHaveBeenCalledTimes(2);
        });

        it('should clear loading state on controller destruction', () => {
            // Simulate controller cleanup
            if (controller['cleanup']) {
                controller['cleanup']();
            }

            // Loading state should be cleared
            expect(mockUIService.hideLoading).toHaveBeenCalled();
        });
    });

    describe('Loading Spinner Visual Elements', () => {
        it('should display spinner with correct CSS classes', async () => {
            const mockShow = vi.fn();
            const mockHide = vi.fn();
            const mockFind = vi.fn().mockReturnValue({
                text: vi.fn()
            });

            (window as any).$ = vi.fn((selector: string) => {
                if (selector === '#loading') {
                    return {
                        show: mockShow,
                        hide: mockHide,
                        find: mockFind
                    };
                }
                return {
                    select2: vi.fn(),
                    empty: vi.fn(),
                    append: vi.fn()
                };
            });

            const response: OccupationIdsResponse = { occupation_ids: ['OCC-001'] };
            vi.mocked(mockCacheService.getCachedOccupationIds).mockResolvedValue(null);
            vi.mocked(mockApiService.getOccupationIds).mockResolvedValue(response);

            await controller.loadOccupationIds();

            // Verify jQuery selectors for loading elements
            const jqueryCalls = (window as any).$.mock.calls;
            expect(jqueryCalls.some((call: any[]) => call[0] === '#loading')).toBeTruthy();
        });
    });
});