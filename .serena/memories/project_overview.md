# SJI-WebApp Project Overview

## Purpose
This is a spatial jobs frontend application that visualizes employment access data for the Dallas-Fort Worth area using interactive maps. It's part of Dallas College LMIC (Labor Market Information Center) and displays transit travelshed indices for job accessibility analysis.

## Main Features
- Interactive map visualization of job accessibility data
- Two main views:
  - **Occupation Map**: Job access by occupation with searchable dropdown (800+ occupation IDs)
  - **Wage Level Map**: Job access by wage level with predefined categories
- Choropleth layers color-coded by z-score categories (<-2.5SD to >=+2.5SD)
- Interactive popups displaying tract GEOID and access scores
- Export functionality for GeoJSON data download
- Client-side caching for improved performance

## Architecture
- Modern single-page application architecture
- Three entry points: index.html, access_occupation.html, access_wagelvl.html
- Controller-based architecture with inheritance pattern
- Service layer for API communication
- Utility modules for common functionality
- Comprehensive test coverage with unit and integration tests