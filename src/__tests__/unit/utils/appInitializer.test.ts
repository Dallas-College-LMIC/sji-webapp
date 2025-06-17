import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppInitializer } from '../../../js/utils/appInitializer';
import { ErrorHandler } from '../../../js/utils/errorHandler';

// Mock ErrorHandler
vi.mock('../../../js/utils/errorHandler', () => ({
    ErrorHandler: {
        logError: vi.fn(),
        showEnhancedError: vi.fn()
    }
}));

describe('AppInitializer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset document ready state
        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'complete'
        });
    });

    afterEach(() => {
        // Remove all event listeners
        const newWindow = window as any;
        newWindow._eventListeners = {};
    });

    describe('initialize', () => {
        class TestController {
            constructor(public containerId: string) {}
        }

        it('should initialize controller successfully', async () => {
            const controller = await AppInitializer.initialize(
                'test-container',
                TestController,
                'TestApp'
            );

            expect(controller).toBeInstanceOf(TestController);
            expect(controller.containerId).toBe('test-container');
        });

        it('should wait for DOM to be ready', async () => {
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'loading'
            });

            const initPromise = AppInitializer.initialize(
                'test-container',
                TestController,
                'TestApp'
            );

            // Simulate DOM ready
            setTimeout(() => {
                Object.defineProperty(document, 'readyState', {
                    writable: true,
                    value: 'complete'
                });
                document.dispatchEvent(new Event('DOMContentLoaded'));
            }, 10);

            const controller = await initPromise;
            expect(controller).toBeInstanceOf(TestController);
        });

        it('should handle initialization errors', async () => {
            class ErrorController {
                constructor() {
                    throw new Error('Initialization failed');
                }
            }

            await expect(
                AppInitializer.initialize('test-container', ErrorController, 'ErrorApp')
            ).rejects.toThrow('Initialization failed');

            expect(ErrorHandler.logError).toHaveBeenCalledWith(
                expect.any(Error),
                'ErrorApp Initialization'
            );
            expect(ErrorHandler.showEnhancedError).toHaveBeenCalledWith(
                'test-container',
                expect.any(Error),
                'application'
            );
        });

        it('should handle non-Error exceptions', async () => {
            class StringErrorController {
                constructor() {
                    throw 'String error';
                }
            }

            await expect(
                AppInitializer.initialize('test-container', StringErrorController, 'StringApp')
            ).rejects.toThrow();

            expect(ErrorHandler.logError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'String error' }),
                'StringApp Initialization'
            );
        });

        it('should log successful initialization', async () => {
            const consoleSpy = vi.spyOn(console, 'log');

            await AppInitializer.initialize(
                'test-container',
                TestController,
                'TestApp'
            );

            expect(consoleSpy).toHaveBeenCalledWith('🚀 Initializing TestApp...');
            expect(consoleSpy).toHaveBeenCalledWith('✅ TestApp initialized successfully');
        });
    });

    describe('setupGlobalErrorHandlers', () => {
        it('should setup unhandledrejection handler', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            
            AppInitializer.setupGlobalErrorHandlers();

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'unhandledrejection',
                expect.any(Function)
            );
        });

        it('should handle unhandled promise rejections', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            
            AppInitializer.setupGlobalErrorHandlers();

            const error = new Error('Unhandled promise');
            // Create a mock event since PromiseRejectionEvent is not available in test environment
            const event = {
                type: 'unhandledrejection',
                reason: error,
                preventDefault: vi.fn()
            } as any;
            
            // Get the handler that was registered
            const addEventListenerCalls = addEventListenerSpy.mock.calls;
            const unhandledRejectionCall = addEventListenerCalls.find(call => call[0] === 'unhandledrejection');
            const handler = unhandledRejectionCall?.[1] as (event: any) => void;
            
            // Call the handler directly
            handler(event);

            expect(ErrorHandler.logError).toHaveBeenCalledWith(
                error,
                'Unhandled Promise Rejection'
            );
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should handle non-Error promise rejections', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            
            AppInitializer.setupGlobalErrorHandlers();

            // Create a mock event since PromiseRejectionEvent is not available in test environment
            const event = {
                type: 'unhandledrejection',
                reason: 'String rejection',
                preventDefault: vi.fn()
            } as any;
            
            // Get the handler that was registered
            const addEventListenerCalls = addEventListenerSpy.mock.calls;
            const unhandledRejectionCall = addEventListenerCalls.find(call => call[0] === 'unhandledrejection');
            const handler = unhandledRejectionCall?.[1] as (event: any) => void;
            
            // Call the handler directly
            handler(event);

            expect(ErrorHandler.logError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'String rejection' }),
                'Unhandled Promise Rejection'
            );
        });

        it('should setup error handler', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            
            AppInitializer.setupGlobalErrorHandlers();

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'error',
                expect.any(Function)
            );
        });

        it('should handle global errors', () => {
            AppInitializer.setupGlobalErrorHandlers();

            const error = new Error('Global error');
            const event = new ErrorEvent('error', {
                error,
                filename: 'test.js',
                lineno: 42,
                colno: 13
            });
            
            window.dispatchEvent(event);

            expect(ErrorHandler.logError).toHaveBeenCalledWith(
                error,
                'Global Error',
                {
                    filename: 'test.js',
                    lineno: 42,
                    colno: 13
                }
            );
        });
    });
});