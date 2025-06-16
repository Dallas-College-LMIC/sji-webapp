import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler, ErrorType } from '../../../js/utils/errorHandler';

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    
    // Clear error history between tests
    ErrorHandler.clearErrorHistory();
    
    // Reset console mocks
    vi.clearAllMocks();
  });

  describe('analyzeError', () => {
    it('should analyze network errors', () => {
      const error = new TypeError('Failed to fetch');
      const context = ErrorHandler.analyzeError(error);
      
      expect(context.type).toBe(ErrorType.NETWORK);
      expect(context.userMessage).toContain('Unable to connect to the server');
      expect(context.technicalMessage).toBe('Failed to fetch');
      expect(context.retryable).toBe(true);
    });

    it('should analyze timeout errors', () => {
      const error = new Error('Request timeout');
      const context = ErrorHandler.analyzeError(error);
      
      expect(context.type).toBe(ErrorType.TIMEOUT);
      expect(context.userMessage).toContain('The request took too long');
      expect(context.retryable).toBe(true);
    });

    it('should analyze 404 errors', () => {
      const error = new Error('Not Found');
      (error as any).status = 404;
      (error as any).endpoint = '/api/data';
      
      const context = ErrorHandler.analyzeError(error);
      
      expect(context.type).toBe(ErrorType.NOT_FOUND);
      expect(context.statusCode).toBe(404);
      expect(context.userMessage).toContain('resource was not found');
      expect(context.retryable).toBe(false);
    });

    it('should analyze 500 errors', () => {
      const error = new Error('Internal Server Error');
      (error as any).status = 500;
      (error as any).statusText = 'Internal Server Error';
      
      const context = ErrorHandler.analyzeError(error);
      
      expect(context.type).toBe(ErrorType.SERVER);
      expect(context.statusCode).toBe(500);
      expect(context.userMessage).toContain('server encountered an error');
      expect(context.retryable).toBe(true);
    });

    it('should analyze permission errors', () => {
      const error = new Error('Forbidden');
      (error as any).status = 403;
      (error as any).statusText = 'Forbidden';
      
      const context = ErrorHandler.analyzeError(error);
      
      expect(context.type).toBe(ErrorType.PERMISSION);
      expect(context.statusCode).toBe(403);
      expect(context.userMessage).toContain('do not have permission');
      expect(context.retryable).toBe(false);
    });

    it('should analyze validation errors', () => {
      const error = new Error('Bad Request');
      (error as any).status = 400;
      (error as any).statusText = 'Bad Request';
      
      const context = ErrorHandler.analyzeError(error);
      
      expect(context.type).toBe(ErrorType.VALIDATION);
      expect(context.statusCode).toBe(400);
      expect(context.userMessage).toContain('problem with your request');
      expect(context.retryable).toBe(false);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Something went wrong');
      const context = ErrorHandler.analyzeError(error);
      
      expect(context.type).toBe(ErrorType.UNKNOWN);
      expect(context.userMessage).toContain('unexpected error occurred');
      expect(context.retryable).toBe(true);
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      ErrorHandler.logError(error, 'TestOperation');
      
      expect(console.error).toHaveBeenCalledWith(
        '[TestOperation] Error:',
        error
      );
    });

    it('should add to error history', () => {
      const error = new Error('Test error');
      ErrorHandler.logError(error, 'TestOperation');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.error).toBe(error);
      expect(history[0]?.context).toBe('TestOperation');
    });

    it('should limit error history size', () => {
      // Add more than MAX_ERROR_HISTORY (50) errors
      for (let i = 0; i < 60; i++) {
        ErrorHandler.logError(new Error(`Error ${i}`), `Context ${i}`);
      }
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(50);
      expect(history[0]?.context).toBe('Context 10'); // Oldest should be removed
    });
  });

  describe('showInlineError', () => {
    it('should show inline error in container', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
      
      ErrorHandler.showInlineError('test-container', 'Test error message');
      
      const errorElement = container.querySelector('.alert-danger');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Test error message');
      
      // Cleanup
      document.body.removeChild(container);
    });

    it('should include retry button if callback provided', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
      
      const retryCallback = vi.fn();
      ErrorHandler.showInlineError('test-container', 'Test error', retryCallback);
      
      const retryButton = container.querySelector('button');
      expect(retryButton).toBeTruthy();
      expect(retryButton?.textContent).toBe('Retry');
      
      retryButton?.click();
      expect(retryCallback).toHaveBeenCalled();
      
      // Cleanup
      document.body.removeChild(container);
    });
  });

  describe('handleApiError', () => {
    it('should show user-friendly error message', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
      
      const error = new Error('API Error');
      (error as any).status = 500;
      
      ErrorHandler.handleApiError(error, 'test-container', 'Failed to load data');
      
      const errorElement = container.querySelector('.alert-danger');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Failed to load data');
      
      // Cleanup
      document.body.removeChild(container);
    });
  });

  describe('createErrorBoundary', () => {
    it('should wrap function with error handling', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const wrapped = ErrorHandler.createErrorBoundary(successFn, 'TestBoundary');
      
      const result = await wrapped();
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalled();
    });

    it('should catch and log errors', async () => {
      const error = new Error('Test error');
      const errorFn = vi.fn().mockRejectedValue(error);
      const wrapped = ErrorHandler.createErrorBoundary(errorFn, 'TestBoundary');
      
      await expect(wrapped()).rejects.toThrow('Test error');
      expect(console.error).toHaveBeenCalledWith('[TestBoundary] Error:', error);
    });
  });

  describe('setupGlobalHandlers', () => {
    it('should setup window error handlers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      ErrorHandler.setupGlobalHandlers();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });
});