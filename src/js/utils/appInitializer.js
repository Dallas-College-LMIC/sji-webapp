import { ErrorHandler } from './errorHandler.js';

/**
 * Base application initializer with common patterns
 */
export class AppInitializer {
    /**
     * Initialize an application controller with error handling
     * @param {string} containerId - ID of the container element
     * @param {Class} ControllerClass - The controller class to instantiate
     * @param {string} appName - Name of the app for error logging
     */
    static async initialize(containerId, ControllerClass, appName = 'Application') {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        try {
            console.log(`🚀 Initializing ${appName}...`);
            const controller = new ControllerClass(containerId);
            console.log(`✅ ${appName} initialized successfully`);
            return controller;
        } catch (error) {
            ErrorHandler.logError(error, appName.toLowerCase());
            ErrorHandler.showErrorMessage(containerId, error, 'application');
            throw error; // Re-throw for caller to handle if needed
        }
    }

    /**
     * Setup global error handlers
     */
    static setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            ErrorHandler.logError(event.reason, 'unhandled-promise');
            event.preventDefault(); // Prevent the default browser error handling
        });

        // Handle general errors
        window.addEventListener('error', (event) => {
            ErrorHandler.logError(event.error, 'global-error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }
}