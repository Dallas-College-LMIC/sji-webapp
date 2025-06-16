import { MapManager } from '../mapUtils';
import { ApiService } from '../api';
import { uiService } from '../services/uiService';
import { ErrorHandler } from '../utils/errorHandler';
import type { GeoJSONResponse, LayerConfig } from '../../types/api';

/**
 * Configuration for data loading
 */
export interface DataLoadConfig {
    /** Parameters to pass to the API */
    params?: Record<string, string>;
    /** Element ID to show loading state (optional) */
    loadingElementId?: string;
    /** Whether to clear existing map data before loading new data */
    clearBeforeLoad?: boolean;
    /** Callback to execute before loading starts */
    onBeforeLoad?: () => void | Promise<void>;
    /** Callback to execute after successful load */
    onAfterLoad?: (data: GeoJSONResponse) => void | Promise<void>;
    /** Callback to execute on error */
    onError?: (error: Error) => void | Promise<void>;
    /** Whether to update export link after loading */
    updateExportLink?: boolean;
}

/**
 * Base class for map controllers with common functionality
 */
export abstract class BaseMapController {
    protected containerId: string;
    protected sourceId: string;
    protected mapManager: MapManager;
    protected apiService: ApiService;
    protected isInitialized: boolean;
    protected isLoading: boolean;

    constructor(containerId: string, sourceId: string = 'map_data') {
        this.containerId = containerId;
        this.sourceId = sourceId;
        this.mapManager = new MapManager(containerId);
        this.apiService = new ApiService();
        this.isInitialized = false;
        this.isLoading = false;
    }

    /**
     * Initialize the map controller - to be implemented by subclasses
     */
    abstract initialize(): Promise<void>;

    /**
     * Common map initialization with empty source
     */
    protected initializeMapWithEmptySource(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.mapManager.onStyleLoad(async () => {
                try {
                    // Initialize with empty source
                    this.mapManager.addSource(this.sourceId, {
                        type: "FeatureCollection",
                        features: []
                    });
                    
                    this.isInitialized = true;
                    resolve();
                } catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    ErrorHandler.logError(err, 'Map Initialization');
                    reject(err);
                }
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
            
            // Add download attribute with timestamp
            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = params.occupation_id 
                ? `occupation_${params.occupation_id}_${timestamp}.geojson`
                : params.wage_level
                ? `wage_${params.wage_level}_${timestamp}.geojson`
                : `data_${timestamp}.geojson`;
            exportElement.download = fileName;
        }
    }

    /**
     * Show loading state for an element
     */
    protected showLoading(elementId: string, message?: string): void {
        uiService.showLoading(elementId, { message });
    }

    /**
     * Hide loading state for an element
     */
    protected hideLoading(elementId: string): void {
        uiService.hideLoading(elementId);
    }

    /**
     * Show error message for an element
     */
    protected showError(elementId: string, message: string): void {
        uiService.showError(elementId, message);
    }

    /**
     * Clear map layers and reset to empty state
     */
    protected clearMap(): void {
        try {
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
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, 'Clear Map');
            ErrorHandler.showInlineError(this.containerId, 'Failed to clear map');
        }
    }

    /**
     * Get layer IDs managed by this controller - to be implemented by subclasses
     */
    protected abstract getLayerIds(): string[];

    /**
     * Generic data loading method with configurable options
     */
    protected async loadData(config: DataLoadConfig = {}): Promise<GeoJSONResponse | null> {
        // Set defaults
        const {
            params = {},
            loadingElementId,
            clearBeforeLoad = false,
            onBeforeLoad,
            onAfterLoad,
            onError,
            updateExportLink = true
        } = config;

        // Prevent concurrent loads
        if (this.isLoading) {
            console.warn('Data load already in progress');
            return null;
        }

        this.isLoading = true;

        // Show loading state if element specified
        if (loadingElementId) {
            this.showLoading(loadingElementId, 'Loading map data...');
        }

        try {
            // Execute before load callback
            if (onBeforeLoad) {
                await onBeforeLoad();
            }

            // Clear map if requested
            if (clearBeforeLoad) {
                this.clearMap();
            }

            // Fetch data from API
            const data = await this.apiService.getGeojsonData(params);
            console.log('Fetched map data:', data);

            // Update map source with new data
            this.mapManager.addSource(this.sourceId, data);

            // Update export link if requested
            if (updateExportLink) {
                this.updateExportLink(params);
            }

            // Execute after load callback
            if (onAfterLoad) {
                await onAfterLoad(data);
            }

            return data;

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, 'Data Loading', { 
                params, 
                sourceId: this.sourceId 
            });
            
            // Show error if loading element exists
            if (loadingElementId) {
                this.showError(loadingElementId, 'Error loading data');
            }
            
            // Show inline error notification
            ErrorHandler.showInlineError(
                this.containerId,
                'Failed to load map data. Click to retry.',
                10000
            );

            // Execute error callback
            if (onError) {
                await onError(err);
            } else {
                // Show enhanced error screen for unhandled errors
                ErrorHandler.showEnhancedError(
                    this.containerId,
                    err,
                    'map',
                    () => this.loadData(config)
                );
            }

            return null;

        } finally {
            this.isLoading = false;
            
            // Hide loading state
            if (loadingElementId) {
                this.hideLoading(loadingElementId);
            }
        }
    }

    /**
     * Check if data is currently being loaded
     */
    protected isDataLoading(): boolean {
        return this.isLoading;
    }

    /**
     * Add or update a layer, removing existing one if present
     */
    protected addOrUpdateLayer(
        layerId: string,
        sourceId: string,
        property: string,
        visibility: 'visible' | 'none' = 'visible',
        popupTitle?: string,
        popupScoreProperty?: string
    ): void {
        // Remove existing layer if present
        if (this.mapManager.map.getLayer(layerId)) {
            this.mapManager.map.removeLayer(layerId);
        }

        // Add the layer
        this.mapManager.addLayer(layerId, sourceId, property, visibility);

        // Add popup events if both title and score property are provided
        if (popupTitle && popupScoreProperty) {
            this.mapManager.addPopupEvents(layerId, popupTitle, popupScoreProperty);
        }
    }

    /**
     * Generate property names for zscore data
     */
    protected generatePropertyNames(baseType: string): {
        zscore: string;
        zscore_cat: string;
    } {
        return {
            zscore: `${baseType}_zscore`,
            zscore_cat: `${baseType}_zscore_cat`
        };
    }

    /**
     * Add multiple layers from configuration
     */
    protected addLayersFromConfig(layers: LayerConfig[]): void {
        layers.forEach(layer => {
            this.addOrUpdateLayer(
                layer.id,
                this.sourceId,
                layer.property,
                layer.visibility,
                layer.title,
                layer.scoreProperty
            );
        });
    }

    /**
     * Setup dropdown change handler with support for native and jQuery/Select2
     */
    protected setupDropdownChangeHandler(
        elementId: string,
        handler: (value: string) => void
    ): void {
        const element = document.getElementById(elementId) as HTMLSelectElement | null;

        if (!element) {
            console.warn(`Dropdown element with id "${elementId}" not found`);
            return;
        }

        // Check if jQuery and Select2 are available
        if (typeof $ !== 'undefined' && $.fn && ($.fn as any).select2) {
            const $element = $(element);
            
            // Check if Select2 is initialized on this element
            if ($element.data('select2')) {
                $element.on('change', (e) => {
                    const value = $(e.target).val() as string;
                    handler(value);
                });
            } else {
                // Fall back to native event listener
                element.addEventListener('change', () => {
                    handler(element.value);
                });
            }
        } else {
            // Use native event listener
            element.addEventListener('change', () => {
                handler(element.value);
            });
        }
    }
}