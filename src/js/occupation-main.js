import { OccupationMapController } from './occupation.js';
import { AppInitializer } from './utils/appInitializer.js';
import '../styles/shared.css';

// Setup global error handlers
AppInitializer.setupGlobalErrorHandlers();

// Initialize the occupation map controller
AppInitializer.initialize('mainmap', OccupationMapController, 'Occupation Map');