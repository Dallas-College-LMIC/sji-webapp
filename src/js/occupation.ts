import { BaseMapController } from './controllers/baseMapController';
import { createCacheService, ICacheService } from './services/cacheService';
import { uiService } from './services/uiService';
import { ErrorHandler } from './utils/errorHandler';

export class OccupationMapController extends BaseMapController {
    private currentOccupationId: string | null; // Used to track the currently selected occupation
    private cacheService: ICacheService;
    private readonly CACHE_KEY = 'occupation_ids';
    private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

    constructor(containerId: string) {
        super(containerId, 'occupation_data');
        this.currentOccupationId = null;
        this.cacheService = createCacheService('localStorage', 'sji_webapp');
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
        this.currentOccupationId = occupationId;
        
        // Generate property names using base class method
        const properties = this.generatePropertyNames(`occupation_${occupationId}`);
        
        // Use base class loadData method
        await this.loadData({
            params: { occupation_id: occupationId },
            clearBeforeLoad: false,
            onAfterLoad: () => {
                // Add or update the occupation layer using base class method
                this.addOrUpdateLayer(
                    'occupation-layer',
                    this.sourceId,
                    properties.zscore_cat,
                    'visible',
                    `Occupation: ${occupationId}`,
                    properties.zscore
                );
                
                // Update export link with current occupation
                this.updateExportLink({ occupation_id: this.currentOccupationId! });
            }
        });
    }
    
    protected clearMap(): void {
        super.clearMap();
        this.currentOccupationId = null;
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