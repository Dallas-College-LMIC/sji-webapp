import { WageMapController } from '../../../js/wage';
import { MapManager } from '../../../js/mapUtils';

/**
 * Testable version of WageMapController that exposes protected methods for testing
 */
export class TestableWageMapController extends WageMapController {
    private _initializeMapWithEmptySourceCalled = false;
    private _loadDataCalled = false;
    private _loadDataConfig: any;

    constructor(containerId: string, mapManager?: MapManager) {
        super(containerId);
        // Replace the MapManager if provided
        if (mapManager) {
            this['mapManager'] = mapManager;
        }
    }

    // Override initialize to use our test methods
    async initialize(): Promise<void> {
        await this.testInitializeMapWithEmptySource();
        
        // Load data using the base class method
        await this.testLoadData({
            onAfterLoad: () => {
                // Add all layers from configuration
                this.testAddLayersFromConfig(this.getLayers());
                
                // Setup dropdown listener
                this.testSetupDropdownListener();
            }
        });
    }

    // Expose protected methods for testing
    public testUpdateExportLink(): void {
        return this.updateExportLink();
    }

    public testSetupDropdownChangeHandler(elementId: string, handler: (value: string) => void): void {
        return this.setupDropdownChangeHandler(elementId, handler);
    }

    public testSetupDropdownListener(): void {
        // Call our own implementation that uses test methods
        const layerOrder = this.getLayers().map(l => l.id);
        
        this.testSetupDropdownChangeHandler('tti', (chosenLayer) => {
            // Update visibility for all layers
            layerOrder.forEach(layerId => {
                (this as any).mapManager.setLayerVisibility(
                    layerId,
                    layerId === chosenLayer ? 'visible' : 'none'
                );
            });
            
            // Update export link with new layer
            this.testUpdateExportLink();
        });
    }

    public testInitializeMapWithEmptySource(): Promise<void> {
        return this.initializeMapWithEmptySource();
    }

    public testLoadData(config?: any): Promise<any> {
        return this.loadData(config);
    }

    public testAddLayersFromConfig(layers: any[]): void {
        return this.addLayersFromConfig(layers);
    }

    // Make layers accessible for testing
    public getLayers() {
        return this['layers'];
    }
}