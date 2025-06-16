/**
 * Centralized error handling utilities
 */
export class ErrorHandler {
    /**
     * Display a user-friendly error message in a container
     * @param {string} containerId - ID of the container element
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where the error occurred
     */
    static showErrorMessage(containerId: string, error: Error, context: string = 'application'): void {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Error container not found:', containerId);
            return;
        }

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa;">
                <div style="text-align: center; padding: 2rem; max-width: 500px;">
                    <h3 style="color: #dc3545; margin-bottom: 1rem;">
                        ${this.getErrorTitle(error, context)}
                    </h3>
                    <p style="color: #6c757d; margin-bottom: 1rem;">
                        ${this.getErrorMessage(error, context)}
                    </p>
                    <p style="color: #6c757d; font-size: 0.9rem;">
                        Expected API endpoint: <code>${apiBaseUrl}</code>
                    </p>
                    <p style="color: #6c757d; font-size: 0.9rem;">
                        Check the console for more details.
                    </p>
                    <button onclick="location.reload()" 
                            style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0d6efd; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get appropriate error title based on error type and context
     */
    static getErrorTitle(error: Error, context: string): string {
        if (error.message?.includes('fetch') || error.name === 'TypeError') {
            return 'API Connection Error';
        }
        if (context === 'map') {
            return 'Map Initialization Error';
        }
        return 'Application Error';
    }

    /**
     * Get user-friendly error message
     */
    static getErrorMessage(error: Error, context: string): string {
        if (error.message?.includes('fetch') || error.name === 'TypeError') {
            return 'Unable to connect to the data API. This application requires a backend API server to provide GeoJSON data.';
        }
        if (context === 'map') {
            return 'Failed to initialize the interactive map. Please check your internet connection and try again.';
        }
        return 'An unexpected error occurred while loading the application.';
    }

    /**
     * Log error with context for debugging
     */
    static logError(error: Error, context: string, additionalInfo: Record<string, any> = {}): void {
        console.group(`🔴 Error in ${context}`);
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('Additional info:', additionalInfo);
        console.groupEnd();
    }
}