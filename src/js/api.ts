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
            const timeoutId = setTimeout(() => controller.abort(), timeout!);
            
            // Store active request for potential cancellation
            const requestKey = `${options.method || 'GET'}-${url}`;
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
                
                clearTimeout(timeoutId);
                this.activeRequests.delete(requestKey);
                
                // Apply response interceptors
                return await this.applyResponseInterceptors(response);
                
            } catch (error) {
                clearTimeout(timeoutId);
                this.activeRequests.delete(requestKey);
                
                lastError = error as Error;
                
                // Check if error is abort (timeout or manual cancellation)
                if (error instanceof Error && error.name === 'AbortError') {
                    throw new Error(`Request timeout after ${timeout}ms`);
                }
                
                // If it's the last attempt, throw the error
                if (attempt === retries) {
                    throw error;
                }
                
                // Log retry attempt
                console.warn(`Retry attempt ${attempt + 1}/${retries} after ${retryDelay}ms delay`);
                
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
        this.activeRequests.forEach((controller, key) => {
            controller.abort();
            console.log(`Cancelled request: ${key}`);
        });
        this.activeRequests.clear();
    }

    /**
     * Enhanced fetch method with better error handling
     */
    async fetchData<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            // Apply request interceptors
            const finalConfig = await this.applyRequestInterceptors(config);
            
            const response = await this.fetchWithRetry(url, {
                method: 'GET',
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
            console.error(`Error fetching data from ${endpoint}:`, error);
            
            // Enhance error with more context
            if (error instanceof Error) {
                (error as any).endpoint = endpoint;
                (error as any).url = url;
            }
            
            throw error;
        }
    }

    async getGeojsonData(params: Record<string, string> = {}): Promise<GeoJSONResponse> {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/geojson?${queryString}` : '/geojson';
        return this.fetchData<GeoJSONResponse>(endpoint);
    }

    async getOccupationIds(): Promise<OccupationIdsResponse> {
        // Occupation IDs are cached, so we can be more aggressive with retries
        return this.fetchData<OccupationIdsResponse>('/occupation_ids', {
            retries: 5,
            timeout: 60000 // 1 minute for initial load
        });
    }

    getExportUrl(params: Record<string, string> = {}): string {
        const queryString = new URLSearchParams(params).toString();
        return queryString ? `${this.baseUrl}/geojson?${queryString}` : `${this.baseUrl}/geojson`;
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