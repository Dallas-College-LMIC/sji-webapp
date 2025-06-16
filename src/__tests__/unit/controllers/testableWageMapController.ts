import { WageMapController } from '../../../js/wage';
import { MapManager } from '../../../js/mapUtils';

/**
 * Testable version of WageMapController that exposes protected methods for testing
 */
export class TestableWageMapController extends WageMapController {
    constructor(containerId: string, mapManager?: MapManager) {
        super(containerId);
        // Replace the MapManager if provided
        if (mapManager) {
            this['mapManager'] = mapManager;
        }
    }

    // Expose protected methods for testing
    public testUpdateExportLink(): void {
        return this.updateExportLink();
    }

    public testSetupDropdownChangeHandler(elementId: string, handler: (value: string) => void): void {
        return this.setupDropdownChangeHandler(elementId, handler);
    }

    public testSetupDropdownListener(): void {
        return (this as any).setupDropdownListener();
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