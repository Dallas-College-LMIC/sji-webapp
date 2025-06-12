# SJI-WebApp Development Roadmap

## Project Overview
This roadmap outlines recommended improvements for the Dallas-Fort Worth Spatial Jobs Index frontend application. The project currently consists of static HTML files with interactive Mapbox visualizations for employment access data.

## 🚨 Critical Security Issues (Immediate Action Required)

### 1. Remove Hardcoded Credentials
**Issue**: `/src/js/config.js` contains exposed API credentials visible to all users
```javascript
// CURRENT (INSECURE)
window.CONFIG = {
  API_USERNAME: 'actual_username',
  API_PASSWORD: 'actual_password'
};

// RECOMMENDED
window.CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'https://api.example.com'
  // Move authentication to server-side proxy
};
```

### 2. Fix HTTPS Mixed Content
**Issue**: HTTP localhost endpoints cause mixed content warnings
**Solution**: Implement development proxy or use HTTPS for all endpoints

### 3. Input Validation
**Issue**: No validation on API responses or user inputs
**Solution**: Add comprehensive data validation and sanitization

---

## 🏗️ Architecture Modernization (High Priority)

### 1. Consolidate Duplicate Codebases
**Issue**: Maintaining both ES6 modules and standalone versions
- `api.js` / `api-standalone.js`
- `mapUtils.js` / `mapUtils-standalone.js`
- `occupation.js` / `occupation-standalone.js`

**Recommendation**: Choose unified approach with build system

### 2. Extract Inline JavaScript
**Issue**: Critical application logic embedded in HTML files
**Solution**: Move all JavaScript to dedicated modules

```javascript
// Create unified application controller
class SpatialJobsApp {
  constructor(config) {
    this.mapManager = new MapManager(config.containerId);
    this.apiService = new ApiService(config.apiConfig);
    this.uxManager = new UXManager();
  }

  async initialize() {
    await this.loadData();
    this.setupEventListeners();
    this.renderInitialState();
  }
}
```

### 3. Implement Build Process
**Current**: Static files served directly
**Recommended**: Use Vite for bundling and optimization

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'public/index.html',
        occupation: 'public/access_occupation.html',
        wage: 'public/access_wagelvl.html'
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

---

## 📊 Performance & Dependencies (High Priority)

### 1. Update Critical Dependencies
- **Mapbox GL JS**: Update from v1.12.0 to v3.x (major performance improvements)
- **Bootstrap**: Consider updating to latest version
- **jQuery**: Evaluate if still needed with modern alternatives

### 2. Implement Caching Strategy
```javascript
class CachedApiService extends ApiService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async fetchData(endpoint) {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await super.fetchData(endpoint);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}
```

### 3. Add Loading States and Error Boundaries
```javascript
class UXManager {
  showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;
  }

  showError(message, container = 'main') {
    const errorHtml = `
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <strong>Error:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    document.getElementById(container).insertAdjacentHTML('afterbegin', errorHtml);
  }
}
```

---

## 🎯 User Experience Improvements (Medium Priority)

### 1. Enhanced Error Handling
```javascript
class RobustApiService extends ApiService {
  async fetchDataWithRetry(endpoint, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchData(endpoint);
      } catch (error) {
        if (attempt === maxRetries) {
          this.handleFinalError(error, endpoint);
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  handleFinalError(error, endpoint) {
    const userMessage = this.getErrorMessage(error);
    this.uxManager.showError(userMessage);
    console.error(`API Error on ${endpoint}:`, error);
  }
}
```

### 2. Progressive Data Loading
- Implement lazy loading for large GeoJSON datasets
- Add data pagination or virtualization for large occupation lists
- Stream data updates instead of full reloads

### 3. Unified Navigation Component
Replace duplicated HTML navigation with reusable component:

```javascript
class NavigationManager {
  constructor(activePageId) {
    this.activePageId = activePageId;
  }

  render(containerId) {
    const nav = this.createNavigation();
    document.getElementById(containerId).innerHTML = nav;
  }

  createNavigation() {
    const pages = [
      { id: 'index', title: 'Project Home', href: 'index.html' },
      { id: 'wage', title: 'Job Access by Wage Level', href: 'access_wagelvl.html' },
      { id: 'occupation', title: 'Job Access by Occupation', href: 'access_occupation.html' },
      { id: 'school', title: 'Job Access by School of (in progress)', href: '#' },
      { id: 'travelsheds', title: 'Travelsheds by Tract (in progress)', href: '#' }
    ];

    return this.generateNavHTML(pages);
  }
}
```

---

## 🔧 Development Workflow (Medium Priority)

### 1. Add Code Quality Tools
```json
// package.json additions
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  },
  "devDependencies": {
    "vite": "^6.3.5",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "playwright": "^1.40.0"
  }
}
```

### 2. TypeScript Migration
Convert JavaScript files to TypeScript for better type safety:

```typescript
interface MapConfig {
  containerId: string;
  style: string;
  center: [number, number];
  zoom: number;
}

interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

class MapManager {
  private map: mapboxgl.Map;
  
  constructor(private config: MapConfig) {
    this.initializeMap();
  }
  
  async addDataLayer<T extends GeoJSON.FeatureCollection>(
    id: string, 
    data: T, 
    propertyName: string
  ): Promise<void> {
    // Implementation
  }
}
```

### 3. Testing Strategy
```javascript
// Example unit test
import { describe, it, expect, vi } from 'vitest';
import { ApiService } from '../src/js/api.js';

describe('ApiService', () => {
  it('should handle API errors gracefully', async () => {
    const apiService = new ApiService();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(apiService.fetchOccupationData()).rejects.toThrow('Network error');
  });

  it('should cache successful responses', async () => {
    const apiService = new CachedApiService();
    const mockData = { features: [] };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    await apiService.fetchData('/test');
    await apiService.fetchData('/test'); // Should use cache
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
```

---

## ♿ Accessibility Improvements (Medium Priority)

### 1. Enhanced Form Accessibility
```html
<!-- Current -->
<select class="form-select" id="occupation-select">
  <option value="">Select an occupation...</option>
</select>

<!-- Improved -->
<label for="occupation-select" class="visually-hidden">Select occupation type</label>
<select 
  class="form-select" 
  id="occupation-select" 
  aria-label="Select occupation for employment access data"
  aria-describedby="occupation-help"
>
  <option value="">Select an occupation...</option>
</select>
<div id="occupation-help" class="form-text">
  Choose an occupation to view employment accessibility data by census tract.
</div>
```

### 2. Map Accessibility
- Add keyboard navigation for map controls
- Implement focus management for interactive elements
- Provide alternative data access methods (data tables)

### 3. Color and Contrast
- Ensure colorbar meets WCAG contrast requirements
- Add pattern/texture alternatives to color-only data representation
- Implement high contrast mode toggle

---

## 📚 Documentation (Lower Priority)

### 1. API Documentation
```javascript
/**
 * Manages Mapbox GL map instances and provides methods for data visualization
 * @class MapManager
 * @example
 * const manager = new MapManager('map-container');
 * manager.onStyleLoad(() => {
 *   manager.addSource('data', geojsonData);
 *   manager.addLayer('choropleth', 'data', 'zscore_cat');
 * });
 */
class MapManager {
  /**
   * Creates a new MapManager instance
   * @param {string} containerId - DOM element ID for map container
   * @param {MapConfig} config - Map configuration options
   */
  constructor(containerId, config = {}) {
    // Implementation
  }
}
```

### 2. Developer Setup Guide
Create comprehensive setup documentation:
- Environment requirements
- API configuration
- Development workflow
- Deployment process

### 3. User Documentation
- Feature usage guides
- Data interpretation help
- Troubleshooting common issues

---

## 🚀 Implementation Timeline

### Phase 1: Security & Critical Issues (Week 1)
- [ ] Remove hardcoded credentials
- [ ] Implement environment variable system
- [ ] Fix HTTPS mixed content issues
- [ ] Add basic input validation

### Phase 2: Architecture Modernization (Weeks 2-3)
- [ ] Consolidate duplicate codebases
- [ ] Extract inline JavaScript
- [ ] Set up Vite build process
- [ ] Update Mapbox GL JS to v3.x

### Phase 3: Performance & UX (Weeks 4-5)
- [ ] Implement caching layer
- [ ] Add loading states and error handling
- [ ] Create unified navigation component
- [ ] Add retry logic for API calls

### Phase 4: Development Workflow (Week 6)
- [ ] Add ESLint and Prettier
- [ ] Set up basic testing framework
- [ ] Implement CI/CD pipeline
- [ ] Add TypeScript configuration

### Phase 5: Accessibility & Polish (Weeks 7-8)
- [ ] Improve form accessibility
- [ ] Add keyboard navigation
- [ ] Enhance color contrast and alternatives
- [ ] Complete documentation

---

## 📊 Success Metrics

### Performance
- [ ] Page load time < 3 seconds
- [ ] API response caching reduces requests by 60%
- [ ] Bundle size reduction of 40%

### Security
- [ ] Zero exposed credentials in client code
- [ ] All API calls over HTTPS
- [ ] Input validation prevents XSS

### User Experience
- [ ] Error messages displayed to users (not just console)
- [ ] Loading states for all async operations
- [ ] 95% uptime with graceful degradation

### Code Quality
- [ ] 80%+ test coverage
- [ ] Zero ESLint errors
- [ ] TypeScript migration complete

---

## 📝 Notes

### Current Strengths to Preserve
- Clean, consistent Dallas College branding
- Functional interactive maps with good performance
- Clear project structure and file organization
- Comprehensive data visualization capabilities

### Technology Decisions
- **Keep Mapbox GL JS**: Core mapping functionality works well
- **Maintain Bootstrap**: UI framework provides good responsive design
- **Consider replacing jQuery**: Only used for Select2, could use vanilla JS alternatives
- **Add TypeScript gradually**: Start with new files, migrate existing ones over time

### Deployment Considerations
- Current static file deployment is simple and effective
- Build process should maintain deployment simplicity
- Consider adding staging environment for testing
- Implement automated deployment from version control

---

*This roadmap should be treated as a living document and updated as development progresses and new requirements emerge.*