import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '../../mocks/mapbox-gl';
import '../../mocks/jquery';
import { TestableWageMapController } from './testableWageMapController';

// Create the mock before the vi.mock call
const mockMapManager = {
  map: {
    on: vi.fn(),
    addSource: vi.fn(),
    removeSource: vi.fn(),
    getSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    getLayer: vi.fn(() => null), // Return null by default (no layer exists)
    setLayoutProperty: vi.fn(),
    isStyleLoaded: vi.fn(() => true), // Add isStyleLoaded method
  },
  containerId: 'test-container',
  popup: {} as any,
  initializeMap: vi.fn(),
  addControls: vi.fn(),
  createLayerColor: vi.fn(),
  onStyleLoad: vi.fn((callback) => {
    // Call the callback immediately to simulate style load
    callback();
  }),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  addPopupEvents: vi.fn(),
  setLayerVisibility: vi.fn(),
};

// Mock the entire mapUtils module
vi.mock('../../../js/mapUtils', () => {
  return {
    MapManager: vi.fn().mockImplementation(() => mockMapManager),
  };
});

// Now import the actual modules
import { mockGeoJSONResponse } from '../../fixtures/apiResponses';
vi.mock('../../../js/api');
vi.mock('../../../js/services/uiService', () => ({
  uiService: {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showError: vi.fn(),
    showNotification: vi.fn(),
  },
}));

describe('WageMapController', () => {
  let controller: TestableWageMapController;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock DOM elements
    document.body.innerHTML = `
      <div id="test-container"></div>
      <div id="loading"></div>
      <select id="tti">
        <option value="pop">Access to All Jobs</option>
        <option value="job">Access to Living Wage Jobs</option>
        <option value="lab">Access to Not Living Wage Jobs</option>
      </select>
      <a id="exp">Export</a>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor and initialization', () => {
    it('should initialize with correct default values', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      expect(controller['containerId']).toBe('test-container');
      expect(controller['sourceId']).toBe('tti_data');
      expect(controller['layers']).toHaveLength(3);
    });

    it('should initialize with correct layer configuration', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      const layers = controller.getLayers();
      
      // Check first layer (pop - visible by default)
      expect(layers[0]).toEqual({
        id: "pop",
        visibility: "visible",
        property: "all_jobs_zscore_cat",
        title: "Access to All Jobs",
        scoreProperty: "all_jobs_zscore"
      });

      // Check second layer (job - hidden by default)
      expect(layers[1]).toEqual({
        id: "job",
        visibility: "none",
        property: "living_wage_zscore_cat",
        title: "Access to Living Wage Jobs",
        scoreProperty: "living_wage_zscore"
      });

      // Check third layer (lab - hidden by default)
      expect(layers[2]).toEqual({
        id: "lab",
        visibility: "none",
        property: "not_living_wage_zscore_cat",
        title: "Access to Not Living Wage Jobs",
        scoreProperty: "Not_Living_Wage_zscore"
      });
    });
  });

  describe('initialize', () => {
    it('should initialize map and load data', async () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      // Mock the methods that should be called
      const initializeMapSpy = vi.spyOn(controller, 'testInitializeMapWithEmptySource').mockResolvedValue();
      const loadDataSpy = vi.spyOn(controller, 'testLoadData').mockResolvedValue(null);
      
      await controller.initialize();
      
      expect(initializeMapSpy).toHaveBeenCalled();
      expect(loadDataSpy).toHaveBeenCalledWith({
        onAfterLoad: expect.any(Function)
      });
    });

    it('should setup layers and dropdown after loading data', async () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      // Mock methods
      vi.spyOn(controller, 'testInitializeMapWithEmptySource').mockResolvedValue();
      const addLayersFromConfigSpy = vi.spyOn(controller, 'testAddLayersFromConfig').mockImplementation(() => {});
      const setupDropdownListenerSpy = vi.spyOn(controller, 'testSetupDropdownListener').mockImplementation(() => {});
      
      // Mock loadData to call onAfterLoad immediately
      vi.spyOn(controller, 'testLoadData').mockImplementation(async (config: any) => {
        if (config?.onAfterLoad) {
          config.onAfterLoad(mockGeoJSONResponse);
        }
      });
      
      await controller.initialize();
      
      expect(addLayersFromConfigSpy).toHaveBeenCalledWith(controller['layers']);
      expect(setupDropdownListenerSpy).toHaveBeenCalled();
    });
  });

  describe('setupDropdownListener', () => {
    it('should setup dropdown change handler', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      const setupDropdownChangeHandlerSpy = vi.spyOn(controller, 'testSetupDropdownChangeHandler').mockImplementation(() => {});
      
      controller.testSetupDropdownListener();
      
      expect(setupDropdownChangeHandlerSpy).toHaveBeenCalledWith('tti', expect.any(Function));
    });

    it('should handle layer visibility changes', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      const updateExportLinkSpy = vi.spyOn(controller, 'testUpdateExportLink').mockImplementation(() => {});
      
      let changeHandler: ((chosenLayer: string) => void) | undefined;
      vi.spyOn(controller, 'testSetupDropdownChangeHandler').mockImplementation((_: string, handler: (value: string) => void) => {
        changeHandler = handler;
      });
      
      controller.testSetupDropdownListener();
      
      // Test layer switching
      expect(changeHandler).toBeDefined();
      changeHandler!('job');
      
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('pop', 'none');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('job', 'visible');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('lab', 'none');
      expect(updateExportLinkSpy).toHaveBeenCalled();
    });

    it('should handle switching to different layers', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      vi.spyOn(controller, 'testUpdateExportLink').mockImplementation(() => {});
      
      let changeHandler: ((chosenLayer: string) => void) | undefined;
      vi.spyOn(controller, 'testSetupDropdownChangeHandler').mockImplementation((_: string, handler: (value: string) => void) => {
        changeHandler = handler;
      });
      
      controller.testSetupDropdownListener();
      
      // Test switching to 'lab' layer
      expect(changeHandler).toBeDefined();
      changeHandler!('lab');
      
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('pop', 'none');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('job', 'none');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('lab', 'visible');
    });
  });

  describe('getLayerIds', () => {
    it('should return correct layer IDs', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      const layerIds = controller['getLayerIds']();
      
      expect(layerIds).toEqual(['pop', 'job', 'lab']);
    });

    it('should return layer IDs in correct order', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      const layerIds = controller['getLayerIds']();
      
      expect(layerIds[0]).toBe('pop');
      expect(layerIds[1]).toBe('job');
      expect(layerIds[2]).toBe('lab');
    });
  });

  describe('layer configuration', () => {
    it('should have layer with correct property mappings', () => {
      controller = new TestableWageMapController('test-container', mockMapManager as any);
      
      const layers = controller.getLayers();
      
      // Verify each layer has required properties
      layers.forEach(layer => {
        expect(layer).toHaveProperty('id');
        expect(layer).toHaveProperty('visibility');
        expect(layer).toHaveProperty('property');
        expect(layer).toHaveProperty('title');
        expect(layer).toHaveProperty('scoreProperty');
        expect(typeof layer.id).toBe('string');
        expect(['visible', 'none'].includes(layer.visibility)).toBe(true);
      });
    });
  });
});