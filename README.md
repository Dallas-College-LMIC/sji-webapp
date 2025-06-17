# Dallas-Fort Worth Spatial Jobs Index (SJI) WebApp

## Overview

The SJI WebApp is an interactive mapping application that visualizes employment access data for the Dallas-Fort Worth metropolitan area. Built for Dallas College LMIC (Labor Market Information Center), this tool helps analyze transit travelshed indices and job accessibility patterns across census tracts.

## Features

- **Interactive Maps**: Visualize employment access data using Mapbox GL JS
- **Occupation-Based Analysis**: Search and filter job access by specific occupations (~800 occupation codes)
- **Wage Level Analysis**: View job accessibility patterns by wage categories
- **Data Export**: Download GeoJSON data for further analysis
- **Performance Optimized**: Client-side caching reduces API calls by ~99%
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technology Stack

- **Build System**: Vite 6.3.5
- **Language**: TypeScript 5.8.3 (strict mode)
- **Mapping**: Mapbox GL JS v1.12.0
- **UI Framework**: Bootstrap 5.0.0-beta2
- **Testing**: Vitest 3.2.3 with 100% test pass rate
- **Package Manager**: npm

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- A Mapbox API token (set in environment variables)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dallas-College-LMIC/sji-webapp.git
cd sji-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

## Project Structure

```
sji-webapp/
├── index.html                 # Landing page
├── access_occupation.html     # Occupation-based map
├── access_wagelvl.html        # Wage level map
├── src/
│   ├── js/                   # TypeScript source files
│   │   ├── controllers/      # Map controllers
│   │   ├── services/         # Caching and UI services
│   │   ├── utils/            # Utilities
│   │   └── ...              # Entry points and core logic
│   ├── styles/              # CSS files
│   ├── types/               # TypeScript type definitions
│   └── __tests__/           # Test suite
├── public/                  # Static assets
└── vite.config.ts          # Vite configuration
```

## API Integration

The application expects a backend API that provides:

- `/occupation_ids` - List of available occupation codes
- `/geojson/{occupation_id}` - GeoJSON data for specific occupations
- `/geojson/wage/{wage_level}` - GeoJSON data for wage levels

## Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This will build the project and deploy to the `gh-pages` branch.

### Environment Configuration

For production deployment:
1. Set `VITE_API_BASE_URL` to your production API endpoint
2. Ensure CORS headers are properly configured on your API
3. Configure your Mapbox token for the production domain

## Performance Features

- **Client-Side Caching**: Occupation IDs are cached for 24 hours
- **Non-Blocking Loading**: Maps load immediately while data fetches in background
- **Optimized Bundle**: Code splitting for faster initial load

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing Guidelines

- All new features must include tests
- Maintain 80%+ code coverage
- Run tests before committing
- Use TypeScript strict mode

## License

This project is part of Dallas College LMIC. Please contact the organization for licensing information.

## Acknowledgments

- Dallas College Labor Market Information Center
- Transit accessibility data providers
- Open source community

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact Dallas College LMIC
- Review the [developer documentation](./CLAUDE.md)

---

Built with ❤️ for better employment accessibility analysis in DFW