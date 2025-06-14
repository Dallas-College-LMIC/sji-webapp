import { BaseMapController } from './controllers/baseMapController.js';

export class WageMapController extends BaseMapController {
    constructor(containerId) {
        super(containerId, 'tti_data');
        this.layers = [
            { id: "pop", visibility: "visible", property: "all_jobs_zscore_cat", title: "Access to All Jobs", scoreProperty: "all_jobs_zscore" },
            { id: "job", visibility: "none", property: "living_wage_zscore_cat", title: "Access to Living Wage Jobs", scoreProperty: "living_wage_zscore" },
            { id: "lab", visibility: "none", property: "not_living_wage_zscore_cat", title: "Access to Not Living Wage Jobs", scoreProperty: "Not_Living_Wage_zscore" }
        ];
        this.initialize();
    }

    async initialize() {
        await this.initializeMapWithEmptySource();
        
        try {
            const geojsonData = await this.apiService.getGeojsonData();
            console.log("Fetched data:", geojsonData);
            
            // Add source with fetched data
            this.mapManager.addSource(this.sourceId, geojsonData);

            // Add layers and popup events
            this.layers.forEach(layer => {
                this.mapManager.addLayer(layer.id, this.sourceId, layer.property, layer.visibility);
                this.mapManager.addPopupEvents(layer.id, layer.title, layer.scoreProperty);
            });

            // Setup dropdown listener
            this.setupDropdownListener();

            // Set initial export URL
            this.updateExportLink();

        } catch (error) {
            console.error("Error loading data:", error);
            throw error; // Re-throw to be handled by error boundary
        }
    }

    setupDropdownListener() {
        const tti = document.getElementById("tti");
        
        if (!tti) {
            console.warn('Dropdown element with id "tti" not found');
            return;
        }
        
        const layerOrder = this.layers.map(l => l.id);
        
        tti.addEventListener("change", () => {
            const chosenLayer = tti.value;
            layerOrder.forEach((layer) => {
                this.mapManager.setLayerVisibility(layer, layer === chosenLayer ? "visible" : "none");
            });
            this.updateExportLink();
        });
    }

    getLayerIds() {
        return this.layers.map(layer => layer.id);
    }
}