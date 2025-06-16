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
    // Clean up any notification containers
    document.querySelectorAll('[id^="ui-notification-"]').forEach(el => el.remove());
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

  describe('addClass', () => {
    it('should add class to element', () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      document.body.appendChild(element);

      uiService.addClass('test-element', 'custom-class');

      expect(element.classList.contains('custom-class')).toBe(true);
    });

    it('should handle missing element', () => {
      expect(() => uiService.addClass('non-existent', 'custom-class')).not.toThrow();
    });
  });

  describe('removeClass', () => {
    it('should remove class from element', () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      element.classList.add('custom-class');
      document.body.appendChild(element);

      uiService.removeClass('test-element', 'custom-class');

      expect(element.classList.contains('custom-class')).toBe(false);
    });

    it('should handle missing element', () => {
      expect(() => uiService.removeClass('non-existent', 'custom-class')).not.toThrow();
    });
  });

  describe('toggleClass', () => {
    it('should toggle class on element', () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      document.body.appendChild(element);

      uiService.toggleClass('test-element', 'custom-class');
      expect(element.classList.contains('custom-class')).toBe(true);

      uiService.toggleClass('test-element', 'custom-class');
      expect(element.classList.contains('custom-class')).toBe(false);
    });

    it('should handle missing element', () => {
      expect(() => uiService.toggleClass('non-existent', 'custom-class')).not.toThrow();
    });
  });

  describe('setDropdownValue', () => {
    it('should set dropdown value and trigger change event', () => {
      const select = document.createElement('select');
      select.id = 'test-dropdown';
      const option1 = document.createElement('option');
      option1.value = 'value1';
      const option2 = document.createElement('option');
      option2.value = 'value2';
      select.appendChild(option1);
      select.appendChild(option2);
      document.body.appendChild(select);

      const changeHandler = vi.fn();
      select.addEventListener('change', changeHandler);

      uiService.setDropdownValue('test-dropdown', 'value2');

      expect(select.value).toBe('value2');
      expect(changeHandler).toHaveBeenCalled();
    });

    it('should handle missing element', () => {
      expect(() => uiService.setDropdownValue('non-existent', 'value')).not.toThrow();
    });
  });

  describe('getDropdownValue', () => {
    it('should get dropdown value', () => {
      const select = document.createElement('select');
      select.id = 'test-dropdown';
      const option = document.createElement('option');
      option.value = 'test-value';
      option.selected = true;
      select.appendChild(option);
      document.body.appendChild(select);

      const value = uiService.getDropdownValue('test-dropdown');

      expect(value).toBe('test-value');
    });

    it('should return null for missing element', () => {
      const value = uiService.getDropdownValue('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('clearDropdownOptions', () => {
    it('should clear all dropdown options', () => {
      const select = document.createElement('select');
      select.id = 'test-dropdown';
      select.innerHTML = '<option>One</option><option>Two</option>';
      document.body.appendChild(select);

      uiService.clearDropdownOptions('test-dropdown');

      expect(select.innerHTML).toBe('');
    });

    it('should handle missing element', () => {
      expect(() => uiService.clearDropdownOptions('non-existent')).not.toThrow();
    });
  });

  describe('addDropdownOptions', () => {
    it('should add options to dropdown', () => {
      const select = document.createElement('select');
      select.id = 'test-dropdown';
      document.body.appendChild(select);

      const options = [
        { value: 'val1', text: 'Option 1' },
        { value: 'val2', text: 'Option 2' }
      ];

      uiService.addDropdownOptions('test-dropdown', options);

      expect(select.children.length).toBe(2);
      expect(select.children[0]?.getAttribute('value')).toBe('val1');
      expect(select.children[0]?.textContent).toBe('Option 1');
      expect(select.children[1]?.getAttribute('value')).toBe('val2');
      expect(select.children[1]?.textContent).toBe('Option 2');
    });

    it('should handle missing element', () => {
      expect(() => uiService.addDropdownOptions('non-existent', [])).not.toThrow();
    });
  });

  describe('clearError', () => {
    it('should clear error state from element', () => {
      const element = document.createElement('input');
      element.id = 'test-input';
      element.classList.add('is-invalid');
      document.body.appendChild(element);

      const errorDiv = document.createElement('div');
      errorDiv.classList.add('invalid-feedback');
      errorDiv.textContent = 'Error message';
      element.insertAdjacentElement('afterend', errorDiv);

      uiService.clearError('test-input');

      expect(element.classList.contains('is-invalid')).toBe(false);
      expect(document.querySelector('.invalid-feedback')).toBeNull();
    });

    it('should handle missing element', () => {
      expect(() => uiService.clearError('non-existent')).not.toThrow();
    });
  });

  // Note: createProgressBar, updateProgressBar, showModal, and hideModal methods 
  // are not implemented in the current uiService
});