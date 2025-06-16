/**
 * Interface for cache service implementations
 */
export interface ICacheService {
    /**
     * Get a value from cache
     * @param key The cache key
     * @returns The cached value or null if not found/expired
     */
    get<T>(key: string): T | null;

    /**
     * Set a value in cache
     * @param key The cache key
     * @param value The value to cache
     * @param ttlSeconds Time to live in seconds (optional)
     */
    set<T>(key: string, value: T, ttlSeconds?: number): void;

    /**
     * Remove a specific key from cache
     * @param key The cache key to remove
     */
    remove(key: string): void;

    /**
     * Clear all cached data
     */
    clear(): void;
}

/**
 * LocalStorage-based cache implementation with TTL support
 */
export class LocalStorageCacheService implements ICacheService {
    private readonly prefix: string;
    
    constructor(prefix: string = 'app') {
        this.prefix = prefix;
    }

    /**
     * Get a value from cache
     */
    get<T>(key: string): T | null {
        const cacheKey = this.getCacheKey(key);
        const cacheTimeKey = this.getCacheTimeKey(key);
        
        try {
            const cachedTime = localStorage.getItem(cacheTimeKey);
            const cachedData = localStorage.getItem(cacheKey);
            
            if (!cachedTime || !cachedData) {
                return null;
            }
            
            // Check if cache is expired
            const cacheTimestamp = parseInt(cachedTime);
            const now = Date.now();
            
            if (now > cacheTimestamp) {
                // Cache expired, remove it
                this.remove(key);
                return null;
            }
            
            return JSON.parse(cachedData) as T;
        } catch (error) {
            console.error(`Error reading from cache for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, ttlSeconds?: number): void {
        const cacheKey = this.getCacheKey(key);
        const cacheTimeKey = this.getCacheTimeKey(key);
        
        try {
            // Calculate expiration time
            const expirationTime = ttlSeconds 
                ? Date.now() + (ttlSeconds * 1000)
                : Date.now() + (365 * 24 * 60 * 60 * 1000); // Default: 1 year
            
            localStorage.setItem(cacheKey, JSON.stringify(value));
            localStorage.setItem(cacheTimeKey, expirationTime.toString());
        } catch (error) {
            console.error(`Error writing to cache for key ${key}:`, error);
            // Don't throw - caching failures should not break the app
        }
    }

    /**
     * Remove a specific key from cache
     */
    remove(key: string): void {
        const cacheKey = this.getCacheKey(key);
        const cacheTimeKey = this.getCacheTimeKey(key);
        
        try {
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(cacheTimeKey);
        } catch (error) {
            console.error(`Error removing cache for key ${key}:`, error);
        }
    }

    /**
     * Clear all cached data for this prefix
     */
    clear(): void {
        try {
            const keysToRemove: string[] = [];
            
            // Find all keys with our prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.prefix}_`)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove them
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    /**
     * Get the cache key with prefix
     */
    private getCacheKey(key: string): string {
        return `${this.prefix}_${key}_cache`;
    }

    /**
     * Get the cache time key with prefix
     */
    private getCacheTimeKey(key: string): string {
        return `${this.prefix}_${key}_cache_time`;
    }
}

/**
 * Factory function to create a cache service
 */
export function createCacheService(type: 'localStorage' = 'localStorage', prefix?: string): ICacheService {
    switch (type) {
        case 'localStorage':
            return new LocalStorageCacheService(prefix);
        default:
            throw new Error(`Unknown cache service type: ${type}`);
    }
}