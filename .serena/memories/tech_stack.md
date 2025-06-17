# Technology Stack

## Build Tools
- **Vite 6.3.5**: Modern build tool for development and production
- **TypeScript 5.8.3**: Statically typed JavaScript with strict mode enabled
- **Node.js 18**: Runtime environment (as seen in CI configuration)

## Frontend Libraries
- **Mapbox GL JS v1.12.0**: Core mapping library for interactive visualization
- **Bootstrap 5.0.0-beta2**: UI framework for responsive layout and styling
- **Select2 4.1.0**: Enhanced searchable dropdown component (occupation map only)
- **jQuery 3.6.0**: Required dependency for Select2
- **ES6 Modules**: Modern module system with import/export syntax

## Testing Stack
- **Vitest 3.2.3**: Fast testing framework with native ESM support
- **Testing Library**: DOM testing utilities for user-centric tests
- **MSW**: Mock Service Worker for API mocking in tests
- **Happy-DOM**: Lightweight browser environment simulation
- **Coverage**: V8 coverage provider with 80% threshold

## Development Tools
- **gh-pages**: GitHub Pages deployment
- **dotenv**: Environment variable management
- **Puppeteer**: Browser automation (for potential E2E tests)

## Environment Configuration
- Environment variables with `VITE_` prefix for client access
- Default API endpoint: localhost:8000
- Production deployment on GitHub Pages with `/sji-webapp/` base path