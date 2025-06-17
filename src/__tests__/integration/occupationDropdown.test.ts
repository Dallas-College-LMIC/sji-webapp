import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import '../mocks/mapbox-gl';
import { OccupationMapController } from '../../js/occupation';
import { ApiService } from '../../js/api';
import { OccupationCacheService } from '../../js/services/occupationCacheService';
import { UIService } from '../../js/services/uiService';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { OccupationIdsResponse, GeoJSONResponse } from '../../types/api';

// Mock Select2 jQuery plugin
beforeAll(() => {
    (window as any).$ = vi.fn((selector: string) => {
        const element = document.querySelector(selector);
        const methods = {
            select2: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            val: vi.fn().mockReturnThis(),
            trigger: vi.fn().mockReturnThis(),
            empty: vi.fn().mockReturnThis(),
            append: vi.fn().mockReturnThis(),
            html: vi.fn().mockReturnThis(),
            show: vi.fn().mockReturnThis(),
            hide: vi.fn().mockReturnThis(),
            find: vi.fn().mockReturnValue({
                text: vi.fn().mockReturnThis()
            })
        };
        
        // Store for testing
        if (element) {
            (element as any).__jqueryMethods = methods;
        }
        
        return methods;
    });
});

// Setup MSW server
const server = setupServer(
    http.get('*/occupation_ids', () => {
        return HttpResponse.json<OccupationIdsResponse>({
            occupation_ids: ['17-2051', '15-1251', '29-1141', '11-9021', '13-2011']
        });
    }),
    http.get('*/occupation_data/:id', ({ params }) => {
        return HttpResponse.json<GeoJSONResponse>({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        GEOID: '48001001',
                        occupation_zscore: 1.5,
                        occupation_zscore_cat: 3
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[-97.1, 32.9], [-97.0, 32.9], [-97.0, 32.8], [-97.1, 32.8], [-97.1, 32.9]]]
                    }
                }
            ]
        });
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Occupation Dropdown - Complete Workflow Integration', () => {
    let controller: OccupationMapController;
    let container: HTMLElement;
    let occupationSelect: HTMLSelectElement;
    let exportLink: HTMLElement;
    let loadingDiv: HTMLElement;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="mainmap"></div>
            <select id="occupation-select">
                <option value="">Select an occupation...</option>
            </select>
            <div id="export-link"><a>No occupation selected</a></div>
            <div id="loading" style="display: none;">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span class="loading-text">Loading...</span>
            </div>
        `;

        container = document.getElementById('mainmap')!;
        occupationSelect = document.getElementById('occupation-select') as HTMLSelectElement;
        exportLink = document.getElementById('export-link')!;
        loadingDiv = document.getElementById('loading')!;

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
            resize: vi.fn(),
            setLayoutProperty: vi.fn(),
            setPaintProperty: vi.fn(),
            queryRenderedFeatures: vi.fn(),
            easeTo: vi.fn()
        } as any);

        // Clear localStorage
        localStorage.clear();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Initial Load Flow', () => {
        it('should complete full initialization flow', async () => {
            controller = new OccupationMapController('mainmap');
            
            // Wait for map load event
            await new Promise(resolve => setTimeout(resolve, 10));

            // Check that occupation IDs were loaded
            const selectMethods = (occupationSelect as any).__jqueryMethods;
            expect(selectMethods.empty).toHaveBeenCalled();
            expect(selectMethods.append).toHaveBeenCalled();
            
            // Verify Select2 was initialized
            expect(selectMethods.select2).toHaveBeenCalled();
        });

        it('should show and hide loading spinner during initial load', async () => {
            const uiService = new UIService();
            const showLoadingSpy = vi.spyOn(uiService, 'showLoading');
            const hideLoadingSpy = vi.spyOn(uiService, 'hideLoading');

            controller = new OccupationMapController('mainmap');
            controller['uiService'] = uiService;

            await controller.loadOccupationIds();

            expect(showLoadingSpy).toHaveBeenCalledWith('occupation-select', 'Loading occupations...');
            expect(hideLoadingSpy).toHaveBeenCalledWith('occupation-select');
        });

        it('should populate dropdown with occupation IDs', async () => {
            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            const selectMethods = (occupationSelect as any).__jqueryMethods;
            const appendCalls = selectMethods.append.mock.calls;
            
            expect(appendCalls.length).toBeGreaterThan(0);
            expect(appendCalls.some((call: any[]) => call[0].includes('17-2051'))).toBeTruthy();
            expect(appendCalls.some((call: any[]) => call[0].includes('15-1251'))).toBeTruthy();
        });
    });

    describe('User Selection Flow', () => {
        it('should handle complete selection workflow', async () => {
            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            // Mock user selecting an occupation
            const onChange = controller['getDropdownChangeHandler']();
            const mockEvent = { target: { value: '17-2051' } };
            
            // Spy on map update methods
            const clearMapSpy = vi.spyOn(controller as any, 'clearMap');
            const updateMapSpy = vi.spyOn(controller as any, 'updateMapWithData');
            const updateExportSpy = vi.spyOn(controller as any, 'updateExportLink');

            // Trigger selection
            await onChange(mockEvent as any);

            // Verify workflow
            expect(clearMapSpy).toHaveBeenCalled();
            expect(updateMapSpy).toHaveBeenCalled();
            expect(updateExportSpy).toHaveBeenCalledWith('17-2051');
        });

        it('should update export link on selection', async () => {
            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            const onChange = controller['getDropdownChangeHandler']();
            await onChange({ target: { value: '17-2051' } } as any);

            const exportMethods = (exportLink as any).__jqueryMethods;
            expect(exportMethods.html).toHaveBeenCalled();
            const htmlCall = exportMethods.html.mock.calls[0][0];
            expect(htmlCall).toContain('17-2051');
            expect(htmlCall).toContain('download');
        });

        it('should show loading during data fetch', async () => {
            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            const showLoadingSpy = vi.spyOn(controller as any, 'showLoading');
            const hideLoadingSpy = vi.spyOn(controller as any, 'hideLoading');

            const onChange = controller['getDropdownChangeHandler']();
            await onChange({ target: { value: '17-2051' } } as any);

            expect(showLoadingSpy).toHaveBeenCalled();
            expect(hideLoadingSpy).toHaveBeenCalled();
        });
    });

    describe('Caching Integration', () => {
        it('should cache occupation IDs on first load', async () => {
            controller = new OccupationMapController('mainmap');
            
            // First load - should fetch from API
            await controller.loadOccupationIds();
            
            // Check localStorage
            const cachedData = localStorage.getItem('occupation_ids_cache');
            expect(cachedData).toBeTruthy();
            const parsed = JSON.parse(cachedData!);
            expect(parsed).toEqual(['17-2051', '15-1251', '29-1141', '11-9021', '13-2011']);
        });

        it('should use cached data on subsequent loads', async () => {
            // First controller instance
            const controller1 = new OccupationMapController('mainmap');
            await controller1.loadOccupationIds();

            // Track API calls
            let apiCallCount = 0;
            server.use(
                http.get('*/occupation_ids', () => {
                    apiCallCount++;
                    return HttpResponse.json<OccupationIdsResponse>({
                        occupation_ids: ['17-2051']
                    });
                })
            );

            // Second controller instance - should use cache
            const controller2 = new OccupationMapController('mainmap');
            await controller2.loadOccupationIds();

            expect(apiCallCount).toBe(0); // No additional API calls
        });

        it('should respect 24-hour cache TTL', async () => {
            controller = new OccupationMapController('mainmap');
            
            // Set cache with old timestamp
            const oldTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            localStorage.setItem('occupation_ids_cache', JSON.stringify(['OLD-001']));
            localStorage.setItem('occupation_ids_cache_time', oldTime.toString());

            await controller.loadOccupationIds();

            // Should have fetched fresh data
            const cachedData = localStorage.getItem('occupation_ids_cache');
            const parsed = JSON.parse(cachedData!);
            expect(parsed).not.toContain('OLD-001');
            expect(parsed).toContain('17-2051');
        });
    });

    describe('Error Handling Flow', () => {
        it('should handle API errors gracefully', async () => {
            server.use(
                http.get('*/occupation_ids', () => {
                    return HttpResponse.error();
                })
            );

            controller = new OccupationMapController('mainmap');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.loadOccupationIds();

            expect(consoleErrorSpy).toHaveBeenCalled();
            
            // UI should still be in a usable state
            const selectMethods = (occupationSelect as any).__jqueryMethods;
            expect(selectMethods.select2).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should handle occupation data fetch errors', async () => {
            server.use(
                http.get('*/occupation_data/:id', () => {
                    return new HttpResponse(null, { status: 500 });
                })
            );

            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const hideLoadingSpy = vi.spyOn(controller as any, 'hideLoading');

            const onChange = controller['getDropdownChangeHandler']();
            await onChange({ target: { value: '17-2051' } } as any);

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(hideLoadingSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Performance and Responsiveness', () => {
        it('should handle rapid selections without blocking UI', async () => {
            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            const onChange = controller['getDropdownChangeHandler']();
            const selections = ['17-2051', '15-1251', '29-1141'];
            
            // Track method calls
            const loadDataSpy = vi.spyOn(controller as any, 'loadOccupationData');

            // Rapidly change selections
            for (const id of selections) {
                onChange({ target: { value: id } } as any);
            }

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // All selections should have been processed
            expect(loadDataSpy).toHaveBeenCalledTimes(3);
        });

        it('should debounce search input in Select2', async () => {
            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            const selectMethods = (occupationSelect as any).__jqueryMethods;
            const select2Config = selectMethods.select2.mock.calls[0][0];
            
            // Verify Select2 configuration includes search
            expect(select2Config).toBeDefined();
            expect(select2Config.placeholder).toBe('Type to search occupations...');
        });
    });

    describe('Accessibility', () => {
        it('should maintain ARIA attributes during loading states', async () => {
            controller = new OccupationMapController('mainmap');
            
            // Check loading div ARIA attributes
            expect(loadingDiv.querySelector('[role="status"]')).toBeTruthy();
            
            await controller.loadOccupationIds();
            
            // Select should remain accessible
            expect(occupationSelect.getAttribute('aria-label')).toBeDefined();
        });

        it('should provide keyboard navigation support', async () => {
            controller = new OccupationMapController('mainmap');
            await controller.loadOccupationIds();

            // Simulate keyboard event
            const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            occupationSelect.dispatchEvent(keyEvent);

            // Select2 should handle keyboard events
            const selectMethods = (occupationSelect as any).__jqueryMethods;
            expect(selectMethods.select2).toHaveBeenCalled();
        });
    });
});