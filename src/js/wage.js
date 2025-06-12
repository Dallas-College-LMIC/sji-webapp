import { MapManager } from './mapUtils.js';
import { ApiService } from './api.js';

export class WageMapController {
    constructor(containerId) {
        this.mapManager = new MapManager(containerId);
        this.apiService = new ApiService();
        this.initialize();
    }

    async initialize() {
        this.mapManager.onStyleLoad(async () => {
            try {
                const geojsonData = await this.apiService.getGeojsonData();
                console.log("Fetched data:", geojsonData);
                
                // Add source with fetched data
                this.mapManager.addSource("tti_data", geojsonData);

                // Layer configurations
                const layers = [
                    { id: "pop", visibility: "visible", property: "all_jobs_zscore_cat", title: "Access to All Jobs", scoreProperty: "all_jobs_zscore" },
                    { id: "job", visibility: "none", property: "living_wage_zscore_cat", title: "Access to Living Wage Jobs", scoreProperty: "living_wage_zscore" },
                    { id: "lab", visibility: "none", property: "not_living_wage_zscore_cat", title: "Access to Not Living Wage Jobs", scoreProperty: "Not_Living_Wage_zscore" }
                ];

                // Add layers and popup events
                layers.forEach(layer => {
                    this.mapManager.addLayer(layer.id, "tti_data", layer.property, layer.visibility);
                    this.mapManager.addPopupEvents(layer.id, layer.title, layer.scoreProperty);
                });

                // Setup dropdown listener
                this.setupDropdownListener(layers.map(l => l.id));

                // Set initial export URL
                document.getElementById("exp").href = this.apiService.getExportUrl();

            } catch (error) {
                console.error("Error loading data:", error);
            }
        });
    }

    setupDropdownListener(layerOrder) {
        const tti = document.getElementById("tti");
        
        tti.addEventListener("change", () => {
            const chosenLayer = tti.value;
            layerOrder.forEach((layer) => {
                this.mapManager.setLayerVisibility(layer, layer === chosenLayer ? "visible" : "none");
            });
            document.getElementById("exp").href = this.apiService.getExportUrl();
        });
    }
}