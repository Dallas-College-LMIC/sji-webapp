import { MapManager } from '../mapUtils';
import { ApiService } from '../api';

/**
 * Base class for map controllers with common functionality
 */
export abstract class BaseMapController {
    protected containerId: string;
    protected sourceId: string;
    protected mapManager: MapManager;
    protected apiService: ApiService;
    protected isInitialized: boolean;

    constructor(containerId: string, sourceId: string = 'map_data') {
        this.containerId = containerId;
        this.sourceId = sourceId;
        this.mapManager = new MapManager(containerId);
        this.apiService = new ApiService();
        this.isInitialized = false;
    }

    /**
     * Initialize the map controller - to be implemented by subclasses
     */
    abstract initialize(): Promise<void>;

    /**
     * Common map initialization with empty source
     */
    protected initializeMapWithEmptySource(): Promise<void> {
        return new Promise((resolve) => {
            this.mapManager.onStyleLoad(async () => {
                // Initialize with empty source
                this.mapManager.addSource(this.sourceId, {
                    type: "FeatureCollection",
                    features: []
                });
                
                this.isInitialized = true;
                resolve();
            });
        });
    }

    /**
     * Update export link with current parameters
     */
    protected updateExportLink(params: Record<string, string> = {}): void {
        const exportElement = document.getElementById('exp') as HTMLAnchorElement | null;
        if (exportElement) {
            exportElement.href = this.apiService.getExportUrl(params);
        }
    }

    /**
     * Show loading state for an element
     */
    protected showLoading(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
            element.textContent = 'Loading...';
        }
    }

    /**
     * Hide loading state for an element
     */
    protected hideLoading(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

    /**
     * Show error message for an element
     */
    protected showError(elementId: string, message: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
            element.textContent = message;
            element.style.color = '#dc3545';
        }
    }

    /**
     * Clear map layers and reset to empty state
     */
    protected clearMap(): void {
        // Remove all custom layers
        this.getLayerIds().forEach(layerId => {
            if (this.mapManager.map.getLayer(layerId)) {
                this.mapManager.map.removeLayer(layerId);
            }
        });

        // Reset source to empty
        this.mapManager.addSource(this.sourceId, {
            type: "FeatureCollection",
            features: []
        });

        // Reset export link
        this.updateExportLink();
    }

    /**
     * Get layer IDs managed by this controller - to be implemented by subclasses
     */
    protected abstract getLayerIds(): string[];
}