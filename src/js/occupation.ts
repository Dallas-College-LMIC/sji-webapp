import { BaseMapController } from './controllers/baseMapController';

export class OccupationMapController extends BaseMapController {
    private currentOccupationId: string | null;

    constructor(containerId: string) {
        super(containerId, 'occupation_data');
        this.currentOccupationId = null;
        this.initialize();
    }

    async initialize(): Promise<void> {
        // Initialize map immediately without waiting for occupation IDs
        await this.initializeMapWithEmptySource();
        
        // Load occupation IDs asynchronously (non-blocking)
        this.loadOccupationIds().catch(error => {
            console.error("Failed to load occupation IDs:", error);
        });
    }

    private async loadOccupationIds(): Promise<void> {
        this.showLoading('loading');
        
        try {
            // Check cache first
            const cachedData = this.getCachedOccupationIds();
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
            const occupationIds = response.occupation_ids || (response as any);
            
            // Cache the data
            this.cacheOccupationIds(occupationIds);
            
            this.populateOccupationDropdown(occupationIds);
            
            this.hideLoading('loading');
        } catch (error) {
            console.error("Error loading occupation IDs:", error);
            this.showError('loading', 'Error loading occupations');
        }
    }
    
    private populateOccupationDropdown(occupationIds: string[]): void {
        const select = $('#occupation-select') as JQuery<HTMLSelectElement>;
        
        // Clear existing options except the first one
        select.find('option:not(:first)').remove();
        
        // Add occupation options
        occupationIds.forEach(id => {
            select.append(new Option(id, id));
        });
        
        // Initialize Select2 for searchable dropdown
        select.select2({
            placeholder: "Search and select an occupation...",
            allowClear: true,
            width: '100%'
        });
        
        // Set up change event listener
        select.on('change', (e) => {
            const selectedOccupation = $(e.target).val() as string;
            if (selectedOccupation) {
                this.loadOccupationData(selectedOccupation);
            } else {
                this.clearMap();
            }
        });
    }
    
    private async loadOccupationData(occupationId: string): Promise<void> {
        this.currentOccupationId = occupationId;
        
        try {
            const data = await this.apiService.getGeojsonData({ occupation_id: occupationId });
            console.log("Fetched occupation data:", data);
            
            // Update the map source
            this.mapManager.addSource(this.sourceId, data);
            
            // Remove existing layer if any
            if (this.mapManager.map.getLayer('occupation-layer')) {
                this.mapManager.map.removeLayer('occupation-layer');
            }
            
            // Add the occupation layer
            this.addOccupationLayer();
            
            // Update export link
            this.updateExportLink({ occupation_id: occupationId });
            
        } catch (error) {
            console.error("Error loading occupation data:", error);
        }
    }
    
    private addOccupationLayer(): void {
        // Assuming the data has a zscore property for the occupation
        const propertyName = `occupation_${this.currentOccupationId}_zscore_cat`;
        
        this.mapManager.addLayer('occupation-layer', this.sourceId, propertyName, 'visible');
        this.addPopupForOccupation();
    }
    
    private addPopupForOccupation(): void {
        const zscoreProperty = `occupation_${this.currentOccupationId}_zscore`;
        
        this.mapManager.addPopupEvents('occupation-layer', `Occupation: ${this.currentOccupationId}`, zscoreProperty);
    }
    
    protected clearMap(): void {
        super.clearMap();
        this.currentOccupationId = null;
    }

    protected getLayerIds(): string[] {
        return ['occupation-layer'];
    }
    
    private getCachedOccupationIds(): string[] | null {
        const cacheKey = 'occupation_ids_cache';
        const cacheTimeKey = 'occupation_ids_cache_time';
        const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        try {
            const cachedTime = localStorage.getItem(cacheTimeKey);
            const cachedData = localStorage.getItem(cacheKey);
            
            if (!cachedTime || !cachedData) {
                return null;
            }
            
            const cacheAge = Date.now() - parseInt(cachedTime);
            
            // Check if cache is expired
            if (cacheAge > cacheTTL) {
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(cacheTimeKey);
                return null;
            }
            
            return JSON.parse(cachedData) as string[];
        } catch (error) {
            console.error("Error reading from cache:", error);
            return null;
        }
    }
    
    private cacheOccupationIds(occupationIds: string[]): void {
        const cacheKey = 'occupation_ids_cache';
        const cacheTimeKey = 'occupation_ids_cache_time';
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(occupationIds));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (error) {
            console.error("Error writing to cache:", error);
            // Continue even if caching fails
        }
    }
    
    clearOccupationCache(): void {
        localStorage.removeItem('occupation_ids_cache');
        localStorage.removeItem('occupation_ids_cache_time');
    }
}