/**
 * Enhanced error handling utilities with better context and recovery options
 */

export enum ErrorType {
    NETWORK = 'NETWORK',
    API = 'API',
    TIMEOUT = 'TIMEOUT',
    VALIDATION = 'VALIDATION',
    PERMISSION = 'PERMISSION',
    NOT_FOUND = 'NOT_FOUND',
    SERVER = 'SERVER',
    UNKNOWN = 'UNKNOWN'
}

export interface ErrorContext {
    type: ErrorType;
    statusCode?: number;
    endpoint?: string;
    retryable: boolean;
    userMessage: string;
    technicalMessage: string;
    recoveryAction?: () => void;
}

export class ErrorHandler {
    private static errorHistory: Array<{error: Error, timestamp: Date, context: string}> = [];
    private static readonly MAX_ERROR_HISTORY = 50;

    /**
     * Analyze error and return context
     */
    static analyzeError(error: Error): ErrorContext {
        const errorAny = error as any;
        
        // Network/Connection errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                type: ErrorType.NETWORK,
                retryable: true,
                userMessage: 'Unable to connect to the server. Please check your internet connection.',
                technicalMessage: error.message
            };
        }

        // Timeout errors
        if (error.message.includes('timeout')) {
            return {
                type: ErrorType.TIMEOUT,
                retryable: true,
                userMessage: 'The request took too long to complete. The server might be busy.',
                technicalMessage: error.message
            };
        }

        // HTTP errors
        if (errorAny.status) {
            const statusCode = errorAny.status;
            
            if (statusCode === 404) {
                return {
                    type: ErrorType.NOT_FOUND,
                    statusCode,
                    endpoint: errorAny.endpoint,
                    retryable: false,
                    userMessage: 'The requested resource was not found.',
                    technicalMessage: `404 Not Found: ${errorAny.endpoint || 'Unknown endpoint'}`
                };
            }
            
            if (statusCode === 403 || statusCode === 401) {
                return {
                    type: ErrorType.PERMISSION,
                    statusCode,
                    retryable: false,
                    userMessage: 'You do not have permission to access this resource.',
                    technicalMessage: `${statusCode} ${errorAny.statusText}`
                };
            }
            
            if (statusCode >= 500) {
                return {
                    type: ErrorType.SERVER,
                    statusCode,
                    retryable: true,
                    userMessage: 'The server encountered an error. Please try again later.',
                    technicalMessage: `${statusCode} Server Error`
                };
            }
            
            if (statusCode >= 400) {
                return {
                    type: ErrorType.VALIDATION,
                    statusCode,
                    retryable: false,
                    userMessage: 'There was a problem with your request.',
                    technicalMessage: `${statusCode} ${errorAny.statusText}`
                };
            }
        }

        // Default unknown error
        return {
            type: ErrorType.UNKNOWN,
            retryable: true,
            userMessage: 'An unexpected error occurred.',
            technicalMessage: error.message || 'Unknown error'
        };
    }

    /**
     * Display enhanced error message with recovery options
     */
    static showEnhancedError(
        containerId: string, 
        error: Error, 
        context: string = 'application',
        onRetry?: () => void
    ): void {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Error container not found:', containerId);
            return;
        }

        const errorContext = this.analyzeError(error);
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        
        // Record error in history
        this.recordError(error, context);
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa;">
                <div style="text-align: center; padding: 2rem; max-width: 600px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">
                        ${this.getErrorIcon(errorContext.type)}
                    </div>
                    <h3 style="color: #dc3545; margin-bottom: 1rem;">
                        ${this.getErrorTitle(errorContext.type, context)}
                    </h3>
                    <p style="color: #6c757d; margin-bottom: 1rem;">
                        ${errorContext.userMessage}
                    </p>
                    ${errorContext.endpoint ? `
                        <p style="color: #6c757d; font-size: 0.9rem;">
                            Failed endpoint: <code>${errorContext.endpoint}</code>
                        </p>
                    ` : ''}
                    <details style="margin: 1rem 0; text-align: left;">
                        <summary style="cursor: pointer; color: #0d6efd;">Technical Details</summary>
                        <div style="margin-top: 0.5rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                            <p style="margin: 0.5rem 0;"><strong>Error Type:</strong> ${errorContext.type}</p>
                            ${errorContext.statusCode ? `<p style="margin: 0.5rem 0;"><strong>Status Code:</strong> ${errorContext.statusCode}</p>` : ''}
                            <p style="margin: 0.5rem 0;"><strong>Message:</strong> ${errorContext.technicalMessage}</p>
                            <p style="margin: 0.5rem 0;"><strong>API URL:</strong> <code>${apiBaseUrl}</code></p>
                            <p style="margin: 0.5rem 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                    </details>
                    <div style="margin-top: 1.5rem;">
                        ${errorContext.retryable ? `
                            <button onclick="${onRetry ? '(' + onRetry.toString() + ')()' : 'location.reload()'}" 
                                    style="margin: 0.25rem; padding: 0.5rem 1.5rem; background: #0d6efd; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
                                Try Again
                            </button>
                        ` : ''}
                        <button onclick="window.history.back()" 
                                style="margin: 0.25rem; padding: 0.5rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
                            Go Back
                        </button>
                        ${this.hasErrorHistory() ? `
                            <button onclick="console.table(${JSON.stringify(this.getErrorSummary())})" 
                                    style="margin: 0.25rem; padding: 0.5rem 1.5rem; background: #ffc107; color: #000; border: none; border-radius: 0.25rem; cursor: pointer;">
                                Show Error History
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get appropriate icon for error type
     */
    private static getErrorIcon(type: ErrorType): string {
        const icons = {
            [ErrorType.NETWORK]: '🌐',
            [ErrorType.API]: '🔌',
            [ErrorType.TIMEOUT]: '⏱️',
            [ErrorType.VALIDATION]: '⚠️',
            [ErrorType.PERMISSION]: '🔒',
            [ErrorType.NOT_FOUND]: '🔍',
            [ErrorType.SERVER]: '🖥️',
            [ErrorType.UNKNOWN]: '❓'
        };
        return icons[type] || '❌';
    }

    /**
     * Get error title based on type and context
     */
    private static getErrorTitle(type: ErrorType, context: string): string {
        if (context === 'map') {
            return 'Map Loading Error';
        }
        
        const titles = {
            [ErrorType.NETWORK]: 'Connection Error',
            [ErrorType.API]: 'API Error',
            [ErrorType.TIMEOUT]: 'Request Timeout',
            [ErrorType.VALIDATION]: 'Invalid Request',
            [ErrorType.PERMISSION]: 'Access Denied',
            [ErrorType.NOT_FOUND]: 'Not Found',
            [ErrorType.SERVER]: 'Server Error',
            [ErrorType.UNKNOWN]: 'Unexpected Error'
        };
        return titles[type] || 'Application Error';
    }

    /**
     * Record error in history
     */
    private static recordError(error: Error, context: string): void {
        this.errorHistory.push({
            error,
            timestamp: new Date(),
            context
        });
        
        // Keep only recent errors
        if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
            this.errorHistory.shift();
        }
    }

    /**
     * Check if we have error history
     */
    private static hasErrorHistory(): boolean {
        return this.errorHistory.length > 0;
    }

    /**
     * Get error summary for debugging
     */
    private static getErrorSummary(): Array<{message: string, context: string, time: string}> {
        return this.errorHistory.map(item => ({
            message: item.error.message,
            context: item.context,
            time: item.timestamp.toLocaleTimeString()
        }));
    }

    /**
     * Enhanced error logging with structured data
     */
    static logError(error: Error, context: string, additionalInfo: Record<string, any> = {}): void {
        const errorContext = this.analyzeError(error);
        
        console.group(`🔴 Error in ${context}`);
        console.error('Error Type:', errorContext.type);
        console.error('User Message:', errorContext.userMessage);
        console.error('Technical Message:', errorContext.technicalMessage);
        console.error('Error Object:', error);
        console.error('Stack:', error.stack);
        console.error('Additional Info:', additionalInfo);
        console.error('Retryable:', errorContext.retryable);
        console.groupEnd();
        
        // Send to monitoring service if configured
        this.sendToMonitoring(error, context, errorContext);
    }

    /**
     * Send errors to monitoring service (placeholder for future implementation)
     */
    private static sendToMonitoring(error: Error, context: string, errorContext: ErrorContext): void {
        // This could be integrated with services like Sentry, LogRocket, etc.
        if (import.meta.env.VITE_MONITORING_ENABLED === 'true') {
            console.log('Would send to monitoring:', { error, context, errorContext });
        }
    }

    /**
     * Show inline error message (non-blocking)
     */
    static showInlineError(elementId: string, message: string, duration: number = 5000): void {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after duration
        setTimeout(() => {
            errorDiv.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(errorDiv);
                document.head.removeChild(style);
            }, 300);
        }, duration);
    }
}