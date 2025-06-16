import { OccupationMapController } from './occupation';
import { AppInitializer } from './utils/appInitializer';
import '../styles/shared.css';

// Setup global error handlers
AppInitializer.setupGlobalErrorHandlers();

// Initialize the occupation map controller
AppInitializer.initialize('mainmap', OccupationMapController, 'Occupation Map');