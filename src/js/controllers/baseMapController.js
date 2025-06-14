import { MapManager } from '../mapUtils.js';
import { ApiService } from '../api.js';

/**
 * Base class for map controllers with common functionality
 */
export class BaseMapController {
    constructor(containerId, sourceId = 'map_data') {
        this.containerId = containerId;
        this.sourceId = sourceId;
        this.mapManager = new MapManager(containerId);
        this.apiService = new ApiService();
        this.isInitialized = false;
    }

    /**
     * Initialize the map controller - to be implemented by subclasses
     */
    async initialize() {
        throw new Error('initialize() method must be implemented by subclass');
    }

    /**
     * Common map initialization with empty source
     */
    initializeMapWithEmptySource() {
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
    updateExportLink(params = {}) {
        const exportElement = document.getElementById('exp');
        if (exportElement) {
            exportElement.href = this.apiService.getExportUrl(params);
        }
    }

    /**
     * Show loading state for an element
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
            element.textContent = 'Loading...';
        }
    }

    /**
     * Hide loading state for an element
     */
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

    /**
     * Show error message for an element
     */
    showError(elementId, message) {
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
    clearMap() {
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
    getLayerIds() {
        return [];
    }
}