import { vi } from 'vitest';
import type { OccupationMapController } from '../../js/occupation';

export interface MockOccupationControllerSetup {
    controller: OccupationMapController;
    mockApiService: any;
    mockCacheService: any;
    mockOccupationCache: any;
    mockMapManager: any;
}

export function createMockOccupationController(containerId: string = 'test-map'): MockOccupationControllerSetup {
    // Create mock services
    const mockApiService = {
        getOccupationIds: vi.fn(),
        getOccupationData: vi.fn(),
        getGeojsonData: vi.fn(),
        getOccupationExportUrl: vi.fn(),
        getExportUrl: vi.fn(),
        cancelAllRequests: vi.fn(),
        createAbortController: vi.fn(() => new AbortController()),
        cancelRequest: vi.fn(),
        getAbortController: vi.fn()
    };

    const mockCacheService = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
    };

    const mockOccupationCache = {
        get: vi.fn(),
        set: vi.fn(),
        clear: vi.fn(),
        getStats: vi.fn().mockReturnValue({
            hits: 0,
            misses: 0,
            evictions: 0,
            memoryUsage: 0,
            totalRequests: 0
        }),
        getDebugInfo: vi.fn().mockReturnValue({
            memoryEntries: 0,
            memoryUsageMB: 0,
            hitRate: 0,
            config: {},
            stats: {
                hits: 0,
                misses: 0,
                evictions: 0,
                memoryUsage: 0,
                totalRequests: 0
            }
        })
    };

    const mockMapManager = {
        map: {
            on: vi.fn(),
            addSource: vi.fn(),
            removeSource: vi.fn(),
            getSource: vi.fn(),
            addLayer: vi.fn(),
            removeLayer: vi.fn(),
            getLayer: vi.fn(() => null),
            setLayoutProperty: vi.fn(),
            isStyleLoaded: vi.fn(() => true),
            addControl: vi.fn(),
            removeControl: vi.fn()
        },
        onStyleLoad: vi.fn((callback) => {
            setTimeout(() => callback(), 0);
        }),
        addSource: vi.fn(),
        addLayer: vi.fn(),
        addPopupEvents: vi.fn(),
        setLayerVisibility: vi.fn()
    };

    // Import the actual controller class
    const { OccupationMapController } = require('../../js/occupation');
    
    // Create controller instance
    const controller = new OccupationMapController(containerId);
    
    // Replace services with mocks
    (controller as any).apiService = mockApiService;
    (controller as any).cacheService = mockCacheService;
    (controller as any).occupationCache = mockOccupationCache;
    (controller as any).mapManager = mockMapManager;

    return {
        controller,
        mockApiService,
        mockCacheService,
        mockOccupationCache,
        mockMapManager
    };
}

export function setupOccupationControllerMocks() {
    // Mock uiService
    vi.mock('../../js/services/uiService', () => ({
        uiService: {
            showLoading: vi.fn(),
            hideLoading: vi.fn(),
            showError: vi.fn(),
            showNotification: vi.fn()
        }
    }));

    // Mock ErrorHandler
    vi.mock('../../js/utils/errorHandler', () => ({
        ErrorHandler: {
            logError: vi.fn(),
            showInlineError: vi.fn(),
            showEnhancedError: vi.fn()
        }
    }));

    // Mock createCacheService
    vi.mock('../../js/services/cacheService', () => ({
        createCacheService: vi.fn(() => ({
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn()
        })),
        CacheService: vi.fn().mockImplementation((_maxSize: number) => ({
            set: vi.fn(),
            get: vi.fn(),
            getSize: vi.fn().mockReturnValue(0),
            clear: vi.fn()
        }))
    }));

    // Mock OccupationCacheService
    vi.mock('../../js/services/occupationCacheService', () => ({
        OccupationCacheService: vi.fn().mockImplementation(() => ({
            get: vi.fn(),
            set: vi.fn(),
            clear: vi.fn(),
            getStats: vi.fn().mockReturnValue({
                hits: 0,
                misses: 0,
                evictions: 0,
                memoryUsage: 0,
                totalRequests: 0
            }),
            getDebugInfo: vi.fn().mockReturnValue({
                memoryEntries: 0,
                memoryUsageMB: 0,
                hitRate: 0,
                config: {},
                stats: {
                    hits: 0,
                    misses: 0,
                    evictions: 0,
                    memoryUsage: 0,
                    totalRequests: 0
                }
            })
        }))
    }));

    // Mock MapManager
    vi.mock('../../js/mapUtils', () => ({
        MapManager: vi.fn().mockImplementation(() => ({
            map: {
                on: vi.fn(),
                addSource: vi.fn(),
                removeSource: vi.fn(),
                getSource: vi.fn(),
                addLayer: vi.fn(),
                removeLayer: vi.fn(),
                getLayer: vi.fn(() => null),
                setLayoutProperty: vi.fn(),
                isStyleLoaded: vi.fn(() => true),
                addControl: vi.fn(),
                removeControl: vi.fn()
            },
            onStyleLoad: vi.fn((callback) => {
                setTimeout(() => callback(), 0);
            }),
            addSource: vi.fn(),
            addLayer: vi.fn(),
            addPopupEvents: vi.fn(),
            setLayerVisibility: vi.fn()
        }))
    }));

    // Mock ApiService
    vi.mock('../../js/api', () => ({
        ApiService: vi.fn().mockImplementation(() => ({
            getOccupationIds: vi.fn(),
            getOccupationData: vi.fn(),
            getGeojsonData: vi.fn(),
            getOccupationExportUrl: vi.fn(),
            getExportUrl: vi.fn(),
            cancelAllRequests: vi.fn(),
            createAbortController: vi.fn(() => new AbortController()),
            cancelRequest: vi.fn(),
            getAbortController: vi.fn()
        }))
    }));
}