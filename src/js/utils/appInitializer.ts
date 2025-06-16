import { ErrorHandler } from './errorHandler';

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
    static async initialize<T>(
        containerId: string, 
        ControllerClass: new (containerId: string) => T, 
        appName: string = 'Application'
    ): Promise<T> {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise<void>(resolve => {
                document.addEventListener('DOMContentLoaded', () => resolve());
            });
        }

        try {
            console.log(`🚀 Initializing ${appName}...`);
            const controller = new ControllerClass(containerId);
            console.log(`✅ ${appName} initialized successfully`);
            return controller;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ErrorHandler.logError(err, appName.toLowerCase());
            ErrorHandler.showErrorMessage(containerId, err, 'application');
            throw error; // Re-throw for caller to handle if needed
        }
    }

    /**
     * Setup global error handlers
     */
    static setupGlobalErrorHandlers(): void {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
            ErrorHandler.logError(error, 'unhandled-promise');
            event.preventDefault(); // Prevent the default browser error handling
        });

        // Handle general errors
        window.addEventListener('error', (event: ErrorEvent) => {
            ErrorHandler.logError(event.error, 'global-error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }
}