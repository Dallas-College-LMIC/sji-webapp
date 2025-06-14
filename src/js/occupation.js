import { BaseMapController } from './controllers/baseMapController.js';

export class OccupationMapController extends BaseMapController {
    constructor(containerId) {
        super(containerId, 'occupation_data');
        this.currentOccupationId = null;
        this.geojsonData = null;
        this.initialize();
    }

    async initialize() {
        await this.initializeMapWithEmptySource();
        await this.loadOccupationIds();
    }

    async loadOccupationIds() {
        this.showLoading('loading');
        
        try {
            const response = await this.apiService.getOccupationIds();
            console.log("Loaded occupation IDs response:", response);
            
            // Handle new API structure - extract occupation_ids array from response
            const occupationIds = response.occupation_ids || response;
            this.populateOccupationDropdown(occupationIds);
            
            this.hideLoading('loading');
        } catch (error) {
            console.error("Error loading occupation IDs:", error);
            this.showError('loading', 'Error loading occupations');
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
    
    addOccupationLayer() {
        // Assuming the data has a zscore property for the occupation
        const propertyName = `occupation_${this.currentOccupationId}_zscore_cat`;
        
        this.mapManager.addLayer('occupation-layer', this.sourceId, propertyName, 'visible');
        this.addPopupForOccupation();
    }
    
    addPopupForOccupation() {
        const zscoreProperty = `occupation_${this.currentOccupationId}_zscore`;
        
        this.mapManager.addPopupEvents('occupation-layer', `Occupation: ${this.currentOccupationId}`, zscoreProperty);
    }
    
    clearMap() {
        super.clearMap();
        this.currentOccupationId = null;
    }

    getLayerIds() {
        return ['occupation-layer'];
    }
}