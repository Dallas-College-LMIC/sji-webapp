import { WageMapController } from './wage.js';
import { AppInitializer } from './utils/appInitializer.js';
import '../styles/shared.css';

// Setup global error handlers
AppInitializer.setupGlobalErrorHandlers();

// Initialize the wage map controller
AppInitializer.initialize('mainmap', WageMapController, 'Wage Map');