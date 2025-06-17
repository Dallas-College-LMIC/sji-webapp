# SJI-WebApp Development Roadmap

## Project Overview
This roadmap outlines the current state and future improvements for the Dallas-Fort Worth Spatial Jobs Index frontend application. The project has been modernized with Vite build system and modular ES6 architecture.

## ✅ Recently Completed (Current State)

### 1. Architecture Modernization
- ✅ **Migrated to Vite build system** - Modern bundling and development server
- ✅ **Consolidated duplicate codebases** - Removed standalone versions
- ✅ **Extracted inline JavaScript** - All logic moved to dedicated modules
- ✅ **Environment variable support** - Added `.env.example` template
- ✅ **ES6 modular architecture** - Clean imports/exports throughout
- ✅ **Updated API integration** - Fixed occupation_ids endpoint structure

### 2. Project Structure Improvements
- ✅ **Moved HTML files to root** - Proper Vite entry points
- ✅ **Created modular JS entry points** - `main.js`, `occupation-main.js`, `wage-main.js`
- ✅ **Updated .gitignore** - Excludes build artifacts
- ✅ **Removed legacy files** - Cleaned up standalone versions

### 3. Development Workflow
- ✅ **Modern package.json** - Updated name and Vite dev dependency
- ✅ **Build configuration** - Multi-entry point Vite setup
- ✅ **Asset handling** - Proper static asset configuration

### 4. Code Architecture & Quality ✅ COMPLETED
- Modern TypeScript architecture with strict mode
- Comprehensive testing infrastructure (Vitest + Testing Library)
- Base controller pattern and centralized error handling
- Client-side caching with localStorage (24-hour TTL)
- Non-blocking initialization for improved performance

---

## 🚨 Security & Environment (High Priority)

### 1. Environment Configuration ⚠️
**Current**: Basic environment variable setup in place
**Next Steps**: 
- Configure production API endpoints
- Implement authentication strategy (if needed)
- Add environment-specific configurations

### 2. Input Validation
**Issue**: No validation on API responses or user inputs
**Solution**: Add comprehensive data validation and sanitization

---

## 🔧 Current Architecture

Modern TypeScript/Vite architecture - see CLAUDE.md for full details.

---

## 📊 Performance & Dependencies (Medium Priority)

### 1. Update Critical Dependencies
- **Mapbox GL JS**: Currently v1.12.0 - consider updating to v3.x (major performance improvements)
- **Bootstrap**: Currently v5.0.0-beta2 - update to stable v5.3+
- **jQuery**: Currently v3.6.0 - only used for Select2, consider vanilla alternatives

### 2. ✅ Caching & Error Handling - COMPLETED
- LocalStorage caching with 24-hour TTL
- Global error handlers with user-friendly messaging
- Loading states and retry functionality

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


### 2. Testing & Code Quality
```json
// Add to package.json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
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

### Phase 1: Remaining Security & Production
- ⚠️ Production HTTPS configuration
- ⚠️ Input validation implementation
- ⚠️ Update Mapbox GL JS to v3.x (from v1.12.0)

### Phase 2: Development Workflow
- [ ] Add ESLint and Prettier configuration
- [ ] Create unified navigation component

### Phase 5: Accessibility & Polish (Future)
- [ ] Improve form accessibility
- [ ] Add keyboard navigation
- [ ] Enhance color contrast and alternatives
- [ ] Complete documentation

---

## 📊 Success Metrics

### Performance
- [x] Page load time < 3 seconds (achieved with non-blocking init)
- [x] API response caching reduces requests by 99% (occupation IDs)
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
- [x] TypeScript with comprehensive testing ✅
- [ ] 80%+ test coverage
- [ ] ESLint/Prettier setup

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
- **Modern TypeScript/Vite stack**: Full type safety with comprehensive testing infrastructure

### Deployment Considerations
- Current static file deployment is simple and effective
- Build process should maintain deployment simplicity
- Consider adding staging environment for testing
- Implement automated deployment from version control

---

*This roadmap should be treated as a living document and updated as development progresses and new requirements emerge.*