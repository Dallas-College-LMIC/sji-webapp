# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a spatial jobs frontend application that visualizes employment access data for the Dallas-Fort Worth area using interactive maps. The project is part of Dallas College LMIC (Labor Market Information Center) and displays transit travelshed indices for job accessibility analysis.

## Modern Architecture (Vite-Based)

The project uses a modern Vite build system with modular ES6 architecture:

- **index.html**: Main landing page with project information
- **access_occupation.html**: Interactive map for job access by occupation with searchable dropdown using Select2
- **access_wagelvl.html**: Interactive map for job access by wage level with predefined categories
- **public/images/colorbar.png**: Legend/colorbar image used across both maps

### Key Technologies
- **Vite 6.3.5**: Modern build tool for development and production
- **Mapbox GL JS v1.12.0**: Core mapping library for interactive visualization
- **Bootstrap 5.0.0-beta2**: UI framework for responsive layout and styling
- **Select2 4.1.0**: Enhanced searchable dropdown component (occupation map only)
- **jQuery 3.6.0**: Required dependency for Select2
- **ES6 Modules**: Modern JavaScript with import/export syntax

### Data Integration
- Maps fetch GeoJSON data from API endpoints 
- Environment variables: `VITE_API_BASE_URL` (Vite prefix required for client access)
- Default API endpoint: localhost:8000 for development
- Data includes census tract geometries with employment access z-scores
- Occupation endpoint: `/occupation_ids` returns `{"occupation_ids": ["17-2051", ...]}`
  - ~800 occupation IDs are cached client-side for 24 hours
  - Non-blocking loading ensures map displays immediately

### Map Features
- **Base Map**: Mapbox light style centered on DFW area (-97.0336, 32.8999)
- **Choropleth Layers**: Color-coded by z-score categories (<-2.5SD to >=+2.5SD)
- **Interactive Popups**: Display tract GEOID and access scores on click
- **Export Functionality**: Direct links to download GeoJSON data
- **Navigation Controls**: Zoom, compass, and fullscreen controls

## Code Architecture

### File Structure
```
src/js/
├── controllers/
│   └── baseMapController.js    # Base class for map controllers
├── utils/
│   ├── appInitializer.js       # Application initialization utilities
│   └── errorHandler.js         # Centralized error handling
├── main.js                     # Homepage entry point
├── occupation-main.js          # Occupation map entry point
├── wage-main.js               # Wage map entry point
├── occupation.js              # OccupationMapController (extends BaseMapController)
├── wage.js                    # WageMapController (extends BaseMapController)
├── api.js                     # API service for data fetching
└── mapUtils.js                # Map utilities and layer management
```

### Development Patterns

#### Controller Inheritance
- Both map controllers extend `BaseMapController` for shared functionality
- Common methods: `initializeMapWithEmptySource()`, `updateExportLink()`, `showLoading()`, `clearMap()`
- Subclasses implement specific logic: `loadOccupationIds()`, `setupDropdownListener()`
- OccupationMapController includes caching methods: `getCachedOccupationIds()`, `cacheOccupationIds()`, `clearOccupationCache()`

#### Error Handling
- Global error handlers for unhandled promises and general errors
- `ErrorHandler` utility provides consistent user-friendly error messages
- Retry functionality built into error screens
- Graceful degradation instead of blank pages

#### Initialization Pattern
- `AppInitializer.initialize()` handles common setup with error boundaries
- Each entry point (`*-main.js`) uses this pattern for consistent behavior
- DOM ready checking and controller instantiation
- Non-blocking initialization: map loads immediately, data loads asynchronously

### API Integration
- `ApiService` handles all HTTP requests with error handling
- Environment variables accessed via `import.meta.env.VITE_*`
- Dynamic layer switching based on user selections
- Property name patterns: `{category}_zscore` and `{category}_zscore_cat`

### Performance Optimizations
- **Client-Side Caching**: 
  - Occupation IDs cached in localStorage with 24-hour TTL
  - Automatic cache invalidation on expiry
  - Reduces API calls by ~99% for returning users
- **Non-Blocking Loading**:
  - Map initializes immediately without waiting for data
  - Occupation IDs load asynchronously in background
  - Improved perceived performance and user experience
- **Cache Management**:
  - Keys: `occupation_ids_cache` and `occupation_ids_cache_time`
  - Graceful degradation if localStorage unavailable
  - Manual cache clearing available via `clearOccupationCache()`

### Styling Conventions
- Uses consistent Dallas College branding (blue #003385 banner, red #E52626 buttons)
- Responsive design with Bootstrap grid system
- CSS imported via ES6 modules (`import '../styles/shared.css'`)
- Map container positioning and legend overlay

## GitHub Pages Deployment

### Configuration
- Base path configured in `vite.config.js`: `/sji-webapp/`
- GitHub Pages deployment via `npm run deploy` (uses gh-pages package)
- Production API URL set via `.env.production` file

### Requirements
- API must have proper CORS headers for GitHub Pages domain
- All features including localStorage caching work on static hosting
- No server-side requirements