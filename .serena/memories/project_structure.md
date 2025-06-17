# Project Structure

## Root Directory
```
sji-webapp/
├── src/                     # Source code
│   ├── js/                  # TypeScript files
│   │   ├── controllers/     # Map controllers (inheritance pattern)
│   │   ├── services/        # Service layer (API, caching)
│   │   ├── utils/          # Utility functions
│   │   ├── *-main.ts       # Entry points for each page
│   │   ├── occupation.ts   # OccupationMapController
│   │   ├── wage.ts         # WageMapController
│   │   ├── api.ts          # API service
│   │   └── mapUtils.ts     # Map utilities
│   ├── types/              # TypeScript definitions
│   ├── styles/             # CSS files
│   ├── components/         # Reusable components
│   └── __tests__/          # All test files
├── public/                 # Static assets
│   └── images/            # Images (colorbar.png, etc.)
├── scripts/               # Build/deployment scripts
├── .github/workflows/     # CI/CD configuration
├── *.html                 # Entry HTML files
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── vitest.config.ts       # Test configuration
└── CLAUDE.md             # Project documentation
```

## Key Entry Points
1. **index.html** - Landing page
2. **access_occupation.html** - Occupation map interface
3. **access_wagelvl.html** - Wage level map interface

## Data Flow
1. HTML loads → Entry TypeScript file (*-main.ts)
2. AppInitializer sets up error handling
3. Controller instantiated (extends BaseMapController)
4. Map initialized with Mapbox GL
5. Data fetched from API (with caching for occupation IDs)
6. Map layers updated based on user interaction