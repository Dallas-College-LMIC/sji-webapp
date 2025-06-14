import { AppInitializer } from './utils/appInitializer.js';
import '../styles/shared.css';

// Setup global error handlers for the main page
AppInitializer.setupGlobalErrorHandlers();

// Main entry point for index.html
console.log('🏠 SJI Webapp homepage loaded successfully');

// Add any homepage-specific functionality here
// For example: analytics, navigation enhancements, etc.