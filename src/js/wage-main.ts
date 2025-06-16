import { WageMapController } from './wage';
import { AppInitializer } from './utils/appInitializer';
import '../styles/shared.css';

// Setup global error handlers
AppInitializer.setupGlobalErrorHandlers();

// Initialize the wage map controller
AppInitializer.initialize('mainmap', WageMapController, 'Wage Map');