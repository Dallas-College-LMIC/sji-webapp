import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { uiService } from '../../../js/services/uiService';

describe('uiService', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('showLoading', () => {
    it('should show loading spinner in element', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      uiService.showLoading('test-container');

      const spinner = container.querySelector('.spinner-border');
      expect(spinner).toBeTruthy();
      expect(container.textContent).toContain('Loading...');
    });

    it('should show custom loading message', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      uiService.showLoading('test-container', { message: 'Custom loading...' });

      expect(container.textContent).toContain('Custom loading...');
    });

    it('should handle missing element gracefully', () => {
      // Should not throw
      expect(() => uiService.showLoading('non-existent')).not.toThrow();
    });
  });

  describe('hideLoading', () => {
    it('should remove loading state from element', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      container.innerHTML = '<div class="spinner-border"></div>';
      document.body.appendChild(container);

      uiService.hideLoading('test-container');

      expect(container.innerHTML).toBe('');
    });
  });

  describe('showError', () => {
    it('should show error message in element', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      uiService.showError('test-container', 'Error occurred');

      const errorElement = container.querySelector('.alert-danger');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Error occurred');
    });

    it('should include retry button if callback provided', () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
      const retryFn = vi.fn();

      uiService.showError('test-container', 'Error occurred', retryFn);

      const retryButton = container.querySelector('button');
      expect(retryButton).toBeTruthy();
      retryButton?.click();
      expect(retryFn).toHaveBeenCalled();
    });
  });

  describe('showNotification', () => {
    it('should create and show success notification', () => {
      uiService.showNotification({
        type: 'success',
        message: 'Operation successful',
        duration: 3000
      });

      const notification = document.querySelector('.alert-success');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toContain('Operation successful');
    });

    it('should auto-remove notification after duration', () => {
      uiService.showNotification({
        type: 'info',
        message: 'Info message',
        duration: 1000
      });

      const notification = document.querySelector('.alert-info');
      expect(notification).toBeTruthy();

      // Fast-forward time (1000ms duration + 300ms dismiss delay)
      vi.advanceTimersByTime(1400);

      expect(document.querySelector('.alert-info')).toBeNull();
    });

    it('should handle different notification types', () => {
      uiService.showNotification({
        type: 'error',
        message: 'Error message'
      });

      const notification = document.querySelector('.alert-danger');
      expect(notification).toBeTruthy();
    });

    it('should position notification at the top', () => {
      uiService.showNotification({
        type: 'warning',
        message: 'Warning message',
        position: 'top'
      });

      const container = document.querySelector('.notification-container-top');
      expect(container).toBeTruthy();
      expect(container?.querySelector('.alert-warning')).toBeTruthy();
    });
  });

  describe('updateElementContent', () => {
    it('should update element content', () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      document.body.appendChild(element);

      uiService.updateElementContent('test-element', 'New content');

      expect(element.innerHTML).toBe('New content');
    });

    it('should handle missing element', () => {
      // Should not throw
      expect(() => uiService.updateElementContent('non-existent', 'content')).not.toThrow();
    });
  });

  describe('setElementVisibility', () => {
    it('should show element', () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      element.style.display = 'none';
      document.body.appendChild(element);

      uiService.setElementVisibility('test-element', true);

      expect(element.style.display).toBe('block');
    });

    it('should hide element', () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      document.body.appendChild(element);

      uiService.setElementVisibility('test-element', false);

      expect(element.style.display).toBe('none');
    });
  });

  describe('addTooltip', () => {
    it('should add tooltip attributes to element', () => {
      const element = document.createElement('button');
      element.id = 'test-button';
      document.body.appendChild(element);

      uiService.addTooltip('test-button', 'Helpful tooltip');

      expect(element.getAttribute('data-bs-toggle')).toBe('tooltip');
      expect(element.getAttribute('data-bs-placement')).toBe('top');
      expect(element.getAttribute('title')).toBe('Helpful tooltip');
    });

    it('should use custom placement', () => {
      const element = document.createElement('button');
      element.id = 'test-button';
      document.body.appendChild(element);

      uiService.addTooltip('test-button', 'Tooltip', 'bottom');

      expect(element.getAttribute('data-bs-placement')).toBe('bottom');
    });
  });
});