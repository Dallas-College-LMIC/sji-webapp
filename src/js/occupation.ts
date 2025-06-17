import { BaseMapController } from './controllers/baseMapController';
import { createCacheService, ICacheService } from './services/cacheService';
import { OccupationCacheService } from './services/occupationCacheService';
import { uiService } from './services/uiService';
import { ErrorHandler } from './utils/errorHandler';

export class OccupationMapController extends BaseMapController {
    private cacheService: ICacheService;
    private occupationCache: OccupationCacheService;
    private readonly CACHE_KEY = 'occupation_ids';
    private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
    private activeRequests = new Map<string, Promise<void>>(); // Request deduplication

    constructor(containerId: string) {
        super(containerId, 'occupation_data');
        this.cacheService = createCacheService('localStorage', 'sji_webapp');
        
        // Initialize high-performance occupation data cache
        this.occupationCache = new OccupationCacheService(this.cacheService, {
            maxMemoryEntries: 50,
            maxMemorySize: 500 * 1024 * 1024, // 500MB
            persistentCacheTTL: 7 * 24 * 60 * 60, // 7 days
            enablePersistence: true,
            preloadPopular: true
        });
        
        // Set up preloading callback
        this.occupationCache.setPreloadCallback(async (occupationId: string) => {
            return await this.apiService.getOccupationData(occupationId);
        });
        
        this.migrateOldCache();
        this.initialize().catch(error => {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, 'Controller Initialization', {
                controller: 'OccupationMapController'
            });
        });
    }

    async initialize(): Promise<void> {
        // Initialize map immediately without waiting for occupation IDs
        await this.initializeMapWithEmptySource();
        
        // Load occupation IDs asynchronously (non-blocking)
        this.loadOccupationIds().catch(error => {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, 'Occupation IDs Loading', {
                controller: 'OccupationMapController'
            });
        });
    }

    private async loadOccupationIds(): Promise<void> {
        this.showLoading('loading', 'Loading occupations...');
        
        try {
            // Check cache first
            const cachedData = this.cacheService.get<string[]>(this.CACHE_KEY);
            if (cachedData) {
                console.log("Using cached occupation IDs");
                this.populateOccupationDropdown(cachedData);
                this.hideLoading('loading');
                return;
            }
            
            // Fetch from API if not cached
            const response = await this.apiService.getOccupationIds();
            console.log("Loaded occupation IDs response:", response);
            
            // Handle new API structure - extract occupation_ids array from response
            const occupationIds = response.occupation_ids || (Array.isArray(response) ? response : []);
            
            // Cache the data with TTL
            this.cacheService.set(this.CACHE_KEY, occupationIds, this.CACHE_TTL);
            
            this.populateOccupationDropdown(occupationIds);
            
            this.hideLoading('loading');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, 'Load Occupation IDs');
            this.showError('loading', 'Error loading occupations');
            uiService.showNotification({
                type: 'error',
                message: 'Failed to load occupation list. Please refresh the page to try again.',
                duration: 10000
            });
        }
    }
    
    private populateOccupationDropdown(occupationIds: string[]): void {
        const select = $('#occupation-select') as JQuery<HTMLSelectElement>;
        
        // Clear existing options except the first one
        select.find('option:not(:first)').remove();
        
        // Add occupation options
        const options = occupationIds.map(id => ({ value: id, text: id }));
        options.forEach(option => {
            select.append(new Option(option.text, option.value));
        });
        
        // Initialize Select2 for searchable dropdown
        select.select2({
            placeholder: "Search and select an occupation...",
            allowClear: true,
            width: '100%'
        });
        
        // Set up change event listener using base class method
        this.setupDropdownChangeHandler('occupation-select', (selectedOccupation) => {
            if (selectedOccupation) {
                this.loadOccupationData(selectedOccupation);
            } else {
                this.clearMap();
            }
        });
        
        // Show success notification
        uiService.showNotification({
            type: 'success',
            message: `Loaded ${occupationIds.length} occupations`,
            duration: 3000
        });
    }
    
    private async loadOccupationData(occupationId: string): Promise<void> {
        // Check if request is already in progress
        if (this.activeRequests.has(occupationId)) {
            console.log(`[OccupationController] Request already in progress for ${occupationId}, waiting...`);
            await this.activeRequests.get(occupationId);
            return;
        }

        // Create new request and store it
        const requestPromise = this.loadOccupationDataDirect(occupationId);
        this.activeRequests.set(occupationId, requestPromise);

        try {
            await requestPromise;
        } finally {
            // Clean up the request tracker
            this.activeRequests.delete(occupationId);
        }
    }

    private async loadOccupationDataDirect(occupationId: string): Promise<void> {
        // Prevent concurrent loads
        if (this.isDataLoading()) {
            console.warn('Data load already in progress');
            return;
        }

        const startTime = performance.now();
        let cacheHit = false;

        try {
            // Check cache first
            let data = await this.occupationCache.get(occupationId);
            
            if (data) {
                cacheHit = true;
                uiService.showLoading('loading', { 
                    message: 'Loading from cache...', 
                    showSpinner: true 
                });
                console.log(`[OccupationController] Cache hit for ${occupationId}`);
            } else {
                uiService.showLoading('loading', { 
                    message: 'Fetching occupation data...', 
                    showSpinner: true 
                });
                console.log(`[OccupationController] Cache miss for ${occupationId}, fetching from API`);
                
                // Fetch from API
                data = await this.apiService.getOccupationData(occupationId);
                
                // Store in cache for future use
                await this.occupationCache.set(occupationId, data);
            }

            // Update map source with data
            this.mapManager.addSource(this.sourceId, data);

            // Add or update the occupation layer with fixed property names
            this.addOrUpdateLayer(
                'occupation-layer',
                this.sourceId,
                'openings_2024_zscore_color', // Fixed property name for categories
                'visible',
                `Occupation: ${occupationId}`,
                'openings_2024_zscore' // Fixed property name for z-scores
            );

            // Update export link to use new endpoint
            this.updateOccupationExportLink(occupationId);

            uiService.hideLoading('loading');

            // Performance feedback
            const loadTime = Math.round(performance.now() - startTime);
            console.log(`[OccupationController] Loaded ${occupationId} in ${loadTime}ms (cache: ${cacheHit ? 'HIT' : 'MISS'})`);
            
            // Show cache stats in development
            if (process.env.NODE_ENV === 'development') {
                console.log('[OccupationCache] Stats:', this.occupationCache.getDebugInfo());
            }

            // Success notification with performance info
            uiService.showNotification({
                type: 'success',
                message: `Loaded occupation data ${cacheHit ? 'from cache' : ''} (${loadTime}ms)`,
                duration: 2000
            });

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, 'Load Occupation Data', { occupationId });
            this.showError('loading', 'Error loading occupation data');
            uiService.showNotification({
                type: 'error',
                message: 'Failed to load occupation data. Please try again.',
                duration: 10000
            });
        }
    }

    private updateOccupationExportLink(occupationId: string): void {
        const exportElement = document.getElementById('exp') as HTMLAnchorElement | null;
        if (exportElement) {
            exportElement.href = this.apiService.getOccupationExportUrl(occupationId);
            
            // Add download attribute with timestamp
            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = `occupation_${occupationId}_${timestamp}.geojson`;
            exportElement.download = fileName;
        }
    }
    
    protected clearMap(): void {
        super.clearMap();
    }

    protected getLayerIds(): string[] {
        return ['occupation-layer'];
    }
    
    /**
     * Clear the occupation IDs cache
     */
    clearOccupationCache(): void {
        this.cacheService.remove(this.CACHE_KEY);
    }
    
    /**
     * Clear all occupation data caches
     */
    clearAllCaches(): void {
        this.clearOccupationCache();
        this.occupationCache.clear();
        console.log('[OccupationController] All caches cleared');
    }
    
    /**
     * Get cache statistics for debugging
     */
    getCacheStats(): any {
        return this.occupationCache.getDebugInfo();
    }
    
    /**
     * Migrate data from old cache format to new cache service
     * This ensures backward compatibility for existing users
     */
    private migrateOldCache(): void {
        const oldCacheKey = 'occupation_ids_cache';
        const oldCacheTimeKey = 'occupation_ids_cache_time';
        
        try {
            const oldData = localStorage.getItem(oldCacheKey);
            const oldTime = localStorage.getItem(oldCacheTimeKey);
            
            if (oldData && oldTime) {
                const occupationIds = JSON.parse(oldData) as string[];
                const timestamp = parseInt(oldTime);
                const age = Date.now() - timestamp;
                
                // Only migrate if data is still valid (within TTL)
                if (age < (this.CACHE_TTL * 1000)) {
                    // Calculate remaining TTL in seconds
                    const remainingTTL = Math.floor((this.CACHE_TTL * 1000 - age) / 1000);
                    this.cacheService.set(this.CACHE_KEY, occupationIds, remainingTTL);
                    console.log("Migrated occupation IDs from old cache format");
                }
                
                // Remove old cache entries regardless of validity
                localStorage.removeItem(oldCacheKey);
                localStorage.removeItem(oldCacheTimeKey);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, 'Cache Migration', {
                action: 'migrate old cache format'
            });
            // Clean up old cache on error
            try {
                localStorage.removeItem(oldCacheKey);
                localStorage.removeItem(oldCacheTimeKey);
            } catch (cleanupError) {
                const cleanupErr = cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError));
                ErrorHandler.logError(cleanupErr, 'Cache Cleanup');
            }
        }
    }
}