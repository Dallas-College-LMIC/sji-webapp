import type { OccupationIdsResponse, GeoJSONResponse } from '../types/api';

interface RequestConfig {
    retries?: number;
    retryDelay?: number;
    timeout?: number;
    headers?: Record<string, string>;
}

interface RequestInterceptor {
    (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

interface ResponseInterceptor {
    onSuccess?: (response: Response) => Response | Promise<Response>;
    onError?: (error: Error) => Error | Promise<Error>;
}

export class ApiService {
    private baseUrl: string;
    private defaultConfig: RequestConfig;
    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];
    private activeRequests = new Map<string, AbortController>();
    private namedControllers = new Map<string, AbortController>();

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        this.defaultConfig = {
            retries: 3,
            retryDelay: 1000,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }

    /**
     * Add a request interceptor
     */
    addRequestInterceptor(interceptor: RequestInterceptor): void {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Add a response interceptor
     */
    addResponseInterceptor(interceptor: ResponseInterceptor): void {
        this.responseInterceptors.push(interceptor);
    }

    /**
     * Apply request interceptors
     */
    private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
        let finalConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            finalConfig = await interceptor(finalConfig);
        }
        return finalConfig;
    }

    /**
     * Apply response interceptors
     */
    private async applyResponseInterceptors(response: Response, error?: Error): Promise<Response> {
        for (const interceptor of this.responseInterceptors) {
            if (error && interceptor.onError) {
                throw await interceptor.onError(error);
            } else if (!error && interceptor.onSuccess) {
                response = await interceptor.onSuccess(response);
            }
        }
        return response;
    }

    /**
     * Fetch with retry logic and timeout
     */
    private async fetchWithRetry(
        url: string, 
        options: RequestInit = {}, 
        config: RequestConfig = {}
    ): Promise<Response> {
        const finalConfig = { ...this.defaultConfig, ...config };
        const { retries, retryDelay, timeout } = finalConfig;
        
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt <= retries!; attempt++) {
            const controller = new AbortController();
            let timeoutId: NodeJS.Timeout | undefined;
            
            // Only set timeout if timeout is defined and greater than 0
            if (timeout && timeout > 0) {
                timeoutId = setTimeout(() => controller.abort(), timeout);
            }
            
            // If an external signal is provided, link it to our controller
            if (options.signal) {
                const externalSignal = options.signal;
                if (externalSignal.aborted) {
                    if (timeoutId) clearTimeout(timeoutId);
                    throw new DOMException('The operation was aborted', 'AbortError');
                }
                
                const abortHandler = () => {
                    controller.abort();
                    if (timeoutId) clearTimeout(timeoutId);
                };
                externalSignal.addEventListener('abort', abortHandler);
            }
            
            // Store active request for potential cancellation
            const requestKey = `${options.method || 'GET'}-${url}-${Date.now()}`;
            this.activeRequests.set(requestKey, controller);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        ...finalConfig.headers,
                        ...options.headers,
                    }
                });
                
                if (timeoutId) clearTimeout(timeoutId);
                this.activeRequests.delete(requestKey);
                
                // Apply response interceptors
                return await this.applyResponseInterceptors(response);
                
            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId);
                this.activeRequests.delete(requestKey);
                
                lastError = error as Error;
                
                // Check if error is abort (timeout or manual cancellation)
                if (error instanceof Error && error.name === 'AbortError') {
                    // If aborted by external signal, don't retry
                    if (options.signal?.aborted) {
                        console.log(`[ApiService] Request aborted by external signal: ${url}`);
                        throw error;
                    }
                    // Otherwise it's a timeout (only if timeout was set)
                    if (timeout && timeout > 0) {
                        throw new Error(`Request timeout after ${timeout}ms`);
                    }
                    throw error;
                }
                
                // If it's the last attempt, throw the error
                if (attempt === retries) {
                    throw error;
                }
                
                // Log retry attempt
                console.warn(`[ApiService] Retry attempt ${attempt + 1}/${retries} after ${retryDelay}ms delay`);
                
                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, retryDelay! * Math.pow(2, attempt)));
            }
        }
        
        throw lastError || new Error('Failed to fetch after all retries');
    }

    /**
     * Cancel all active requests
     */
    cancelAllRequests(): void {
        const activeCount = this.activeRequests.size;
        const namedCount = this.namedControllers.size;
        
        if (activeCount > 0) {
            console.log(`[ApiService] Cancelling ${activeCount} active requests`);
            this.activeRequests.forEach((controller, key) => {
                controller.abort();
                console.log(`[ApiService] Cancelled request: ${key}`);
            });
            this.activeRequests.clear();
        }
        
        if (namedCount > 0) {
            console.log(`[ApiService] Cancelling ${namedCount} named controllers`);
            this.namedControllers.forEach((controller, name) => {
                controller.abort();
                console.log(`[ApiService] Cancelled named controller: ${name}`);
            });
            this.namedControllers.clear();
        }
    }

    /**
     * Create a named AbortController that can be reused across multiple requests
     * If a controller with the same name exists, it will be aborted first
     */
    createAbortController(name: string): AbortController {
        // Cancel existing controller with same name if it exists
        const existing = this.namedControllers.get(name);
        if (existing) {
            console.log(`[ApiService] Aborting existing controller: ${name}`);
            existing.abort();
        }
        
        const controller = new AbortController();
        this.namedControllers.set(name, controller);
        
        // Clean up when aborted
        controller.signal.addEventListener('abort', () => {
            this.namedControllers.delete(name);
        });
        
        return controller;
    }

    /**
     * Get an existing named AbortController
     */
    getAbortController(name: string): AbortController | undefined {
        return this.namedControllers.get(name);
    }

    /**
     * Cancel a specific named request
     */
    cancelRequest(name: string): boolean {
        const controller = this.namedControllers.get(name);
        if (controller) {
            console.log(`[ApiService] Cancelling named request: ${name}`);
            controller.abort();
            this.namedControllers.delete(name);
            return true;
        }
        return false;
    }

    /**
     * Enhanced fetch method with better error handling
     */
    async fetchData<T>(endpoint: string, config: RequestConfig = {}, signal?: AbortSignal): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            // Apply request interceptors
            const finalConfig = await this.applyRequestInterceptors(config);
            
            const response = await this.fetchWithRetry(url, {
                method: 'GET',
                signal,
            }, finalConfig);

            if (!response.ok) {
                const errorBody = await response.text();
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                (error as any).status = response.status;
                (error as any).statusText = response.statusText;
                (error as any).body = errorBody;
                throw error;
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || (!contentType.includes('application/json') && !contentType.includes('application/geo+json'))) {
                throw new Error('Invalid response: Expected JSON but received ' + contentType);
            }

            return await response.json() as T;
        } catch (error) {
            // Don't log abort errors as errors - they're expected
            if (error instanceof Error && error.name === 'AbortError') {
                console.log(`[ApiService] Request cancelled for ${endpoint}`);
            } else {
                console.error(`[ApiService] Error fetching data from ${endpoint}:`, error);
            }
            
            // Enhance error with more context
            if (error instanceof Error) {
                (error as any).endpoint = endpoint;
                (error as any).url = url;
            }
            
            throw error;
        }
    }

    async getGeojsonData(params: Record<string, string> = {}, signal?: AbortSignal): Promise<GeoJSONResponse> {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/geojson?${queryString}` : '/geojson';
        return this.fetchData<GeoJSONResponse>(endpoint, {}, signal);
    }

    async getOccupationIds(signal?: AbortSignal): Promise<OccupationIdsResponse> {
        // Occupation IDs are cached, so we can be more aggressive with retries
        return this.fetchData<OccupationIdsResponse>('/occupation_ids', {
            retries: 5,
            timeout: undefined // No timeout - let the request complete
        }, signal);
    }

    async getOccupationData(occupationId: string, signal?: AbortSignal): Promise<GeoJSONResponse> {
        console.log(`[ApiService] Fetching occupation data for: ${occupationId}`);
        return this.fetchData<GeoJSONResponse>(`/occupation_data/${occupationId}`, {
            timeout: undefined // No timeout - let the request complete
        }, signal);
    }

    getExportUrl(params: Record<string, string> = {}): string {
        const queryString = new URLSearchParams(params).toString();
        return queryString ? `${this.baseUrl}/geojson?${queryString}` : `${this.baseUrl}/geojson`;
    }

    getOccupationExportUrl(occupationId: string): string {
        return `${this.baseUrl}/occupation_data/${occupationId}`;
    }

    /**
     * Health check endpoint
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/health`, {
                method: 'GET'
            }, {
                retries: 1,
                timeout: 5000
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}