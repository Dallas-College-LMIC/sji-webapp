# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a spatial jobs frontend application that visualizes employment access data for the Dallas-Fort Worth area using interactive maps. The project is part of Dallas College LMIC (Labor Market Information Center) and displays transit travelshed indices for job accessibility analysis.

## Architecture

The project consists of static HTML files that create interactive web mapping applications:

- **access_occupation.html**: Interactive map for job access by occupation with searchable dropdown using Select2
- **access_wagelvl.html**: Interactive map for job access by wage level with predefined categories
- **colorbar.png**: Legend/colorbar image used across both maps

### Key Technologies
- **Mapbox GL JS v1.12.0**: Core mapping library for interactive visualization
- **Bootstrap 5.0.0-beta2**: UI framework for responsive layout and styling
- **Select2 4.1.0**: Enhanced searchable dropdown component (occupation map only)
- **jQuery 3.6.0**: Required dependency for Select2

### Data Integration
- Maps fetch GeoJSON data from API endpoints using Basic Authentication
- Environment variables expected: `API_BASE_URL`, `API_USERNAME`, `API_PASSWORD`
- Fallback hardcoded endpoints exist for development (localhost:8000)
- Data includes census tract geometries with employment access z-scores

### Map Features
- **Base Map**: Mapbox light style centered on DFW area (-97.0336, 32.8999)
- **Choropleth Layers**: Color-coded by z-score categories (<-2.5SD to >=+2.5SD)
- **Interactive Popups**: Display tract GEOID and access scores on click
- **Export Functionality**: Direct links to download GeoJSON data
- **Navigation Controls**: Zoom, compass, and fullscreen controls

## Development Notes

### Styling Conventions
- Uses consistent Dallas College branding (blue #003385 banner, red #E52626 buttons)
- Responsive design with Bootstrap grid system
- Custom CSS for map container positioning and legend overlay

### API Integration Pattern
- Authentication headers constructed with btoa() encoding
- Error handling with console logging for debugging
- Dynamic layer switching based on user selections
- Property name patterns: `{category}_zscore` and `{category}_zscore_cat`

### Code Organization
- Inline JavaScript within HTML files
- Layer management through visibility toggling rather than add/remove
- Popup event handlers attached per layer type
- Color schemes defined as Mapbox GL expressions using categorical matching