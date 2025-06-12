import { MapManager } from './mapUtils.js';
import { ApiService } from './api.js';

export class OccupationMapController {
    constructor(containerId) {
        this.mapManager = new MapManager(containerId);
        this.apiService = new ApiService();
        this.currentOccupationId = null;
        this.geojsonData = null;
        this.initialize();
    }

    async initialize() {
        this.mapManager.onStyleLoad(async () => {
            // Initialize the map with empty source
            this.mapManager.addSource("occupation_data", {
                type: "FeatureCollection",
                features: []
            });
            
            // Load occupation IDs
            await this.loadOccupationIds();
        });
    }

    async loadOccupationIds() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        
        try {
            const response = await this.apiService.getOccupationIds();
            console.log("Loaded occupation IDs response:", response);
            
            // Handle new API structure - extract occupation_ids array from response
            const occupationIds = response.occupation_ids || response;
            this.populateOccupationDropdown(occupationIds);
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        } catch (error) {
            console.error("Error loading occupation IDs:", error);
            if (loadingElement) {
                loadingElement.textContent = 'Error loading occupations';
            }
        }
    }
    
    populateOccupationDropdown(occupationIds) {
        const select = $('#occupation-select');
        
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
            const selectedOccupation = $(e.target).val();
            if (selectedOccupation) {
                this.loadOccupationData(selectedOccupation);
            } else {
                this.clearMap();
            }
        });
    }
    
    async loadOccupationData(occupationId) {
        this.currentOccupationId = occupationId;
        
        try {
            const data = await this.apiService.getGeojsonData({ occupation_id: occupationId });
            console.log("Fetched occupation data:", data);
            this.geojsonData = data;
            
            // Update the map source
            this.mapManager.addSource('occupation_data', data);
            
            // Remove existing layer if any
            if (this.mapManager.map.getLayer('occupation-layer')) {
                this.mapManager.map.removeLayer('occupation-layer');
            }
            
            // Add the occupation layer
            this.addOccupationLayer();
            
            // Update export link
            document.getElementById('exp').href = this.apiService.getExportUrl({ occupation_id: occupationId });
            
        } catch (error) {
            console.error("Error loading occupation data:", error);
        }
    }
    
    addOccupationLayer() {
        // Assuming the data has a zscore property for the occupation
        const propertyName = `occupation_${this.currentOccupationId}_zscore_cat`;
        
        this.mapManager.addLayer('occupation-layer', 'occupation_data', propertyName, 'visible');
        this.addPopupForOccupation();
    }
    
    addPopupForOccupation() {
        const zscoreProperty = `occupation_${this.currentOccupationId}_zscore`;
        
        this.mapManager.addPopupEvents('occupation-layer', `Occupation: ${this.currentOccupationId}`, zscoreProperty);
    }
    
    clearMap() {
        if (this.mapManager.map.getLayer('occupation-layer')) {
            this.mapManager.map.removeLayer('occupation-layer');
        }
        
        this.mapManager.addSource('occupation_data', {
            type: "FeatureCollection",
            features: []
        });
        
        this.currentOccupationId = null;
        document.getElementById('exp').href = '#';
    }
}