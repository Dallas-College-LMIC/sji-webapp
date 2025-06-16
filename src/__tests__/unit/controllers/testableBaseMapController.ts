import { BaseMapController } from '../../../js/controllers/baseMapController';
import { MapManager } from '../../../js/mapUtils';

/**
 * Testable version of BaseMapController that exposes protected methods for testing
 */
export class TestableBaseMapController extends BaseMapController {
    constructor(containerId: string, sourceId: string = 'map_data', mapManager?: MapManager) {
        super(containerId, sourceId);
        // Replace the MapManager if provided
        if (mapManager) {
            this['mapManager'] = mapManager;
        }
    }

    // Expose protected methods for testing
    public testInitializeMapWithEmptySource(): Promise<void> {
        return this.initializeMapWithEmptySource();
    }

    public testLoadData(config?: any): Promise<any> {
        return this.loadData(config);
    }

    public testShowLoading(elementId: string, message?: string): void {
        return this.showLoading(elementId, message);
    }

    public testHideLoading(elementId: string): void {
        return this.hideLoading(elementId);
    }

    public testShowError(elementId: string, message: string): void {
        return this.showError(elementId, message);
    }

    public testClearMap(): void {
        return this.clearMap();
    }

    public testAddLayersFromConfig(layers: any[]): void {
        return this.addLayersFromConfig(layers);
    }

    // Implement abstract methods for testing
    protected getLayerIds(): string[] {
        return ['test-layer'];
    }

    async initialize(): Promise<void> {
        await this.initializeMapWithEmptySource();
    }
}