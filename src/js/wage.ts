import { BaseMapController } from './controllers/baseMapController';
import type { LayerConfig } from '../types/api';

export class WageMapController extends BaseMapController {
    private layers: LayerConfig[];

    constructor(containerId: string) {
        super(containerId, 'tti_data');
        this.layers = [
            { 
                id: "pop", 
                visibility: "visible", 
                property: "all_jobs_zscore_cat", 
                title: "Access to All Jobs", 
                scoreProperty: "all_jobs_zscore" 
            },
            { 
                id: "job", 
                visibility: "none", 
                property: "living_wage_zscore_cat", 
                title: "Access to Living Wage Jobs", 
                scoreProperty: "living_wage_zscore" 
            },
            { 
                id: "lab", 
                visibility: "none", 
                property: "not_living_wage_zscore_cat", 
                title: "Access to Not Living Wage Jobs", 
                scoreProperty: "Not_Living_Wage_zscore" 
            }
        ];
        this.initialize();
    }

    async initialize(): Promise<void> {
        await this.initializeMapWithEmptySource();
        
        // Load data using the base class method
        await this.loadData({
            onAfterLoad: () => {
                // Add all layers from configuration
                this.addLayersFromConfig(this.layers);
                
                // Setup dropdown listener
                this.setupDropdownListener();
            }
        });
    }

    private setupDropdownListener(): void {
        const layerOrder = this.layers.map(l => l.id);
        
        this.setupDropdownChangeHandler('tti', (chosenLayer) => {
            // Update layer visibility based on selection
            layerOrder.forEach((layerId) => {
                this.mapManager.setLayerVisibility(
                    layerId, 
                    layerId === chosenLayer ? "visible" : "none"
                );
            });
            
            // Update export link to reflect current selection
            this.updateExportLink();
        });
    }

    protected getLayerIds(): string[] {
        return this.layers.map(layer => layer.id);
    }
}