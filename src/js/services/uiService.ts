/**
 * UI Service for centralized DOM manipulation and user interface updates
 */

export interface LoadingOptions {
    message?: string;
    showSpinner?: boolean;
    overlay?: boolean;
}

export interface NotificationOptions {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
    dismissible?: boolean;
}

export interface ModalOptions {
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    type?: 'info' | 'warning' | 'danger';
}

export class UIService {
    private static instance: UIService;
    private activeNotifications: Set<HTMLElement> = new Set();
    private loadingElements: Map<string, HTMLElement> = new Map();

    private constructor() {}

    static getInstance(): UIService {
        if (!UIService.instance) {
            UIService.instance = new UIService();
        }
        return UIService.instance;
    }

    /**
     * Show loading state for an element
     */
    showLoading(elementId: string, options: LoadingOptions = {}): void {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with id '${elementId}' not found`);
            return;
        }

        const {
            message = 'Loading...',
            showSpinner = true,
            overlay = false
        } = options;

        const loadingHTML = `
            <div class="loading-container" ${overlay ? 'style="position: relative;"' : ''}>
                ${overlay ? '<div class="loading-overlay"></div>' : ''}
                <div class="loading-content d-flex align-items-center">
                    ${showSpinner ? `
                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    ` : ''}
                    <span>${message}</span>
                </div>
            </div>
        `;

        // Store original content
        if (!this.loadingElements.has(elementId)) {
            this.loadingElements.set(elementId, element.cloneNode(true) as HTMLElement);
        }

        element.innerHTML = loadingHTML;
        element.style.display = 'block';

        // Add styles if not already present
        this.ensureLoadingStyles();
    }

    /**
     * Hide loading state and restore original content
     */
    hideLoading(elementId: string): void {
        const element = document.getElementById(elementId);
        const originalContent = this.loadingElements.get(elementId);

        if (element && originalContent) {
            element.innerHTML = originalContent.innerHTML;
            element.style.display = originalContent.style.display || '';
            this.loadingElements.delete(elementId);
        } else if (element) {
            // If no original content was stored, clear the element
            element.innerHTML = '';
        }
    }

    /**
     * Show notification message
     */
    showNotification(options: NotificationOptions): void {
        const {
            type,
            message,
            duration = 5000,
            position = 'top-right',
            dismissible = true
        } = options;

        const notification = this.createNotificationElement(type, message, dismissible);
        this.positionNotification(notification, position);
        
        // Only append to body if not already positioned in a container
        if (position !== 'top') {
            document.body.appendChild(notification);
        }
        this.activeNotifications.add(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-dismiss if duration is set
        if (duration > 0) {
            setTimeout(() => this.dismissNotification(notification), duration);
        }
    }

    /**
     * Show confirmation modal
     */
    showModal(options: ModalOptions): Promise<boolean> {
        return new Promise((resolve) => {
            const {
                title,
                content,
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                onConfirm,
                onCancel,
                type = 'info'
            } = options;

            const modalHTML = `
                <div class="modal fade" tabindex="-1" id="ui-service-modal">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${content}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    ${cancelText}
                                </button>
                                <button type="button" class="btn btn-${this.getButtonClass(type)}" id="modal-confirm">
                                    ${confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove any existing modal
            const existingModal = document.getElementById('ui-service-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const modalElement = document.getElementById('ui-service-modal')!;
            
            // Initialize Bootstrap modal
            const modal = new (window as any).bootstrap.Modal(modalElement);
            
            // Set up event handlers
            const confirmBtn = document.getElementById('modal-confirm')!;
            confirmBtn.addEventListener('click', () => {
                modal.hide();
                resolve(true);
                if (onConfirm) onConfirm();
            });

            modalElement.addEventListener('hidden.bs.modal', () => {
                modalElement.remove();
                resolve(false);
                if (onCancel) onCancel();
            });

            modal.show();
        });
    }

    /**
     * Update element text content
     */
    updateText(elementId: string, text: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Update element HTML content
     */
    updateHTML(elementId: string, html: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }

    /**
     * Toggle element visibility
     */
    toggleVisibility(elementId: string, visible?: boolean): void {
        const element = document.getElementById(elementId);
        if (element) {
            if (visible === undefined) {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            } else {
                element.style.display = visible ? 'block' : 'none';
            }
        }
    }

    /**
     * Enable/disable element
     */
    setEnabled(elementId: string, enabled: boolean): void {
        const element = document.getElementById(elementId) as HTMLInputElement | HTMLButtonElement;
        if (element) {
            element.disabled = !enabled;
        }
    }

    /**
     * Add CSS class to element
     */
    addClass(elementId: string, className: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * Remove CSS class from element
     */
    removeClass(elementId: string, className: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * Toggle CSS class on element
     */
    toggleClass(elementId: string, className: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle(className);
        }
    }

    /**
     * Set dropdown value (for select elements)
     */
    setDropdownValue(elementId: string, value: string): void {
        const element = document.getElementById(elementId) as HTMLSelectElement;
        if (element) {
            element.value = value;
            
            // Trigger change event for Select2 or other listeners
            const event = new Event('change', { bubbles: true });
            element.dispatchEvent(event);
        }
    }

    /**
     * Get dropdown value
     */
    getDropdownValue(elementId: string): string | null {
        const element = document.getElementById(elementId) as HTMLSelectElement;
        return element ? element.value : null;
    }

    /**
     * Clear dropdown options
     */
    clearDropdownOptions(elementId: string): void {
        const element = document.getElementById(elementId) as HTMLSelectElement;
        if (element) {
            element.innerHTML = '';
        }
    }

    /**
     * Add options to dropdown
     */
    addDropdownOptions(elementId: string, options: Array<{value: string, text: string}>): void {
        const element = document.getElementById(elementId) as HTMLSelectElement;
        if (element) {
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                element.appendChild(optionElement);
            });
        }
    }

    /**
     * Show error state for an element
     */
    showError(elementId: string, message: string, retryCallback?: () => void): void {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with id '${elementId}' not found`);
            return;
        }

        // Create error alert similar to Bootstrap alert-danger
        const errorHTML = `
            <div class="alert alert-danger" role="alert">
                ${message}
                ${retryCallback ? '<button type="button" class="btn btn-sm btn-outline-danger ms-2">Retry</button>' : ''}
            </div>
        `;

        element.innerHTML = errorHTML;

        // Add retry functionality if callback provided
        if (retryCallback) {
            const retryButton = element.querySelector('button');
            if (retryButton) {
                retryButton.addEventListener('click', retryCallback);
            }
        }
    }

    /**
     * Clear error state for an element
     */
    clearError(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('is-invalid');
            
            const errorElement = element.nextElementSibling;
            if (errorElement && errorElement.classList.contains('invalid-feedback')) {
                errorElement.remove();
            }
        }
    }

    /**
     * Create notification element
     */
    private createNotificationElement(type: string, message: string, dismissible: boolean): HTMLElement {
        const notification = document.createElement('div');
        
        // Use Bootstrap alert classes for compatibility with tests
        const bootstrapTypeMap: Record<string, string> = {
            success: 'alert-success',
            error: 'alert-danger',
            warning: 'alert-warning',
            info: 'alert-info'
        };

        notification.className = `alert ${bootstrapTypeMap[type] || 'alert-info'} notification notification-${type}`;
        
        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <span class="notification-icon">${iconMap[type as keyof typeof iconMap]}</span>
            <span class="notification-message">${message}</span>
            ${dismissible ? '<button class="notification-close">&times;</button>' : ''}
        `;

        if (dismissible) {
            const closeBtn = notification.querySelector('.notification-close') as HTMLButtonElement;
            closeBtn.addEventListener('click', () => this.dismissNotification(notification));
        }

        return notification;
    }

    /**
     * Position notification element
     */
    private positionNotification(notification: HTMLElement, position: string): void {
        // Handle special case for 'top' position - create container for test compatibility
        if (position === 'top') {
            let container = document.querySelector('.notification-container-top') as HTMLElement;
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container-top';
                container.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999;';
                document.body.appendChild(container);
            }
            container.appendChild(notification);
            notification.style.position = 'relative';
            notification.style.margin = '10px 0';
        } else {
            // Use existing positioning logic for other positions
            const positions: Record<string, string> = {
                'top-right': 'top: 20px; right: 20px;',
                'top-left': 'top: 20px; left: 20px;',
                'bottom-right': 'bottom: 20px; right: 20px;',
                'bottom-left': 'bottom: 20px; left: 20px;',
                'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
            };

            notification.style.cssText = positions[position] || positions['top-right']!;
        }
        
        this.ensureNotificationStyles();
    }

    /**
     * Dismiss notification
     */
    private dismissNotification(notification: HTMLElement): void {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            this.activeNotifications.delete(notification);
        }, 300);
    }

    /**
     * Get button class for modal type
     */
    private getButtonClass(type: string): string {
        const classMap = {
            info: 'primary',
            warning: 'warning',
            danger: 'danger'
        };
        return classMap[type as keyof typeof classMap] || 'primary';
    }

    /**
     * Ensure loading styles are present
     */
    private ensureLoadingStyles(): void {
        if (!document.getElementById('ui-service-loading-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-service-loading-styles';
            style.textContent = `
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.8);
                    z-index: 100;
                }
                .loading-content {
                    position: relative;
                    z-index: 101;
                    padding: 1rem;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Ensure notification styles are present
     */
    private ensureNotificationStyles(): void {
        if (!document.getElementById('ui-service-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-service-notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    padding: 1rem 1.5rem;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    z-index: 9999;
                    max-width: 400px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .notification.show {
                    opacity: 1;
                }
                .notification-success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .notification-error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .notification-warning {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeeba;
                }
                .notification-info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                .notification-icon {
                    font-weight: bold;
                    font-size: 1.2rem;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    margin-left: auto;
                    padding: 0;
                    line-height: 1;
                    opacity: 0.7;
                }
                .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications(): void {
        this.activeNotifications.forEach(notification => {
            this.dismissNotification(notification);
        });
    }

    /**
     * Clear all loading states
     */
    clearAllLoading(): void {
        this.loadingElements.forEach((_, elementId) => {
            this.hideLoading(elementId);
        });
    }

    /**
     * Update element content (alias for updateHTML for backward compatibility)
     */
    updateElementContent(elementId: string, content: string): void {
        this.updateHTML(elementId, content);
    }

    /**
     * Set element visibility (alias for toggleVisibility with explicit visible parameter)
     */
    setElementVisibility(elementId: string, visible: boolean): void {
        this.toggleVisibility(elementId, visible);
    }

    /**
     * Add tooltip attributes to element for Bootstrap tooltips
     */
    addTooltip(elementId: string, title: string, placement: string = 'top'): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute('data-bs-toggle', 'tooltip');
            element.setAttribute('data-bs-placement', placement);
            element.setAttribute('title', title);
        }
    }
}

// Export singleton instance
export const uiService = UIService.getInstance();