import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WageMapController } from '../../../js/wage';
import { mockGeoJSONResponse } from '../../fixtures/apiResponses';
import '../../mocks/mapbox-gl';
import '../../mocks/jquery';

// Mock dependencies
vi.mock('../../../js/mapUtils');
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
  let controller: WageMapController;

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
      controller = new WageMapController('test-container');
      
      expect(controller['containerId']).toBe('test-container');
      expect(controller['sourceId']).toBe('tti_data');
      expect(controller['layers']).toHaveLength(3);
    });

    it('should initialize with correct layer configuration', () => {
      controller = new WageMapController('test-container');
      
      const layers = controller['layers'];
      
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
      controller = new WageMapController('test-container');
      
      // Mock the methods that should be called
      const initializeMapSpy = vi.spyOn(controller, 'initializeMapWithEmptySource').mockResolvedValue();
      const loadDataSpy = vi.spyOn(controller, 'loadData').mockResolvedValue();
      
      await controller.initialize();
      
      expect(initializeMapSpy).toHaveBeenCalled();
      expect(loadDataSpy).toHaveBeenCalledWith({
        onAfterLoad: expect.any(Function)
      });
    });

    it('should setup layers and dropdown after loading data', async () => {
      controller = new WageMapController('test-container');
      
      // Mock methods
      vi.spyOn(controller, 'initializeMapWithEmptySource').mockResolvedValue();
      const addLayersFromConfigSpy = vi.spyOn(controller, 'addLayersFromConfig').mockImplementation(() => {});
      const setupDropdownListenerSpy = vi.spyOn(controller as any, 'setupDropdownListener').mockImplementation(() => {});
      
      // Mock loadData to call onAfterLoad immediately
      vi.spyOn(controller, 'loadData').mockImplementation(async (config) => {
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
      controller = new WageMapController('test-container');
      
      const setupDropdownChangeHandlerSpy = vi.spyOn(controller, 'setupDropdownChangeHandler').mockImplementation(() => {});
      
      controller['setupDropdownListener']();
      
      expect(setupDropdownChangeHandlerSpy).toHaveBeenCalledWith('tti', expect.any(Function));
    });

    it('should handle layer visibility changes', () => {
      controller = new WageMapController('test-container');
      
      // Mock mapManager
      const mockMapManager = {
        setLayerVisibility: vi.fn(),
      };
      controller['mapManager'] = mockMapManager as any;
      
      const updateExportLinkSpy = vi.spyOn(controller, 'updateExportLink').mockImplementation(() => {});
      
      let changeHandler: (chosenLayer: string) => void;
      vi.spyOn(controller, 'setupDropdownChangeHandler').mockImplementation((_, handler) => {
        changeHandler = handler;
      });
      
      controller['setupDropdownListener']();
      
      // Test layer switching
      changeHandler('job');
      
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('pop', 'none');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('job', 'visible');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('lab', 'none');
      expect(updateExportLinkSpy).toHaveBeenCalled();
    });

    it('should handle switching to different layers', () => {
      controller = new WageMapController('test-container');
      
      // Mock mapManager
      const mockMapManager = {
        setLayerVisibility: vi.fn(),
      };
      controller['mapManager'] = mockMapManager as any;
      
      vi.spyOn(controller, 'updateExportLink').mockImplementation(() => {});
      
      let changeHandler: (chosenLayer: string) => void;
      vi.spyOn(controller, 'setupDropdownChangeHandler').mockImplementation((_, handler) => {
        changeHandler = handler;
      });
      
      controller['setupDropdownListener']();
      
      // Test switching to 'lab' layer
      changeHandler('lab');
      
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('pop', 'none');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('job', 'none');
      expect(mockMapManager.setLayerVisibility).toHaveBeenCalledWith('lab', 'visible');
    });
  });

  describe('getLayerIds', () => {
    it('should return correct layer IDs', () => {
      controller = new WageMapController('test-container');
      
      const layerIds = controller['getLayerIds']();
      
      expect(layerIds).toEqual(['pop', 'job', 'lab']);
    });

    it('should return layer IDs in correct order', () => {
      controller = new WageMapController('test-container');
      
      const layerIds = controller['getLayerIds']();
      
      expect(layerIds[0]).toBe('pop');
      expect(layerIds[1]).toBe('job');
      expect(layerIds[2]).toBe('lab');
    });
  });

  describe('layer configuration', () => {
    it('should have layer with correct property mappings', () => {
      controller = new WageMapController('test-container');
      
      const layers = controller['layers'];
      
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