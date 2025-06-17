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
            
            if (!cachedData || !cachedTime) {
                return null;
            }
            
            const cacheTime = parseInt(cachedTime);
            const now = Date.now();
            
            // Check if cache has expired
            if (now > cacheTime) {
                this.remove(key);
                return null;
            }
            
            return JSON.parse(cachedData) as T;
        } catch (error) {
            console.warn(`Failed to get cache for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
        const cacheKey = this.getCacheKey(key);
        const cacheTimeKey = this.getCacheTimeKey(key);
        
        try {
            const expirationTime = Date.now() + (ttlSeconds * 1000);
            localStorage.setItem(cacheKey, JSON.stringify(value));
            localStorage.setItem(cacheTimeKey, expirationTime.toString());
        } catch (error) {
            console.warn(`Failed to set cache for key ${key}:`, error);
            // Silently fail - cache is optional
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
            console.warn(`Failed to remove cache for key ${key}:`, error);
        }
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        try {
            const keysToRemove: string[] = [];
            
            // Find all keys with our prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix + '_')) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove all found keys
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('Failed to clear cache:', error);
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
 * Memory-based cache implementation (useful for testing)
 */
export class MemoryCacheService implements ICacheService {
    private cache = new Map<string, { value: any; expiration: number }>();

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }
        
        if (Date.now() > entry.expiration) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
        const expiration = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiration });
    }

    remove(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

/**
 * Generic memory cache with LRU eviction and size tracking
 * This is used for performance testing and advanced caching scenarios
 */
export class CacheService<T> {
    private cache = new Map<string, { value: T; lastAccessed: number; size: number }>();
    private maxSize: number;
    private currentSize: number = 0;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    set(key: string, value: T, size: number = 1): void {
        // Remove old entry if exists
        if (this.cache.has(key)) {
            const oldEntry = this.cache.get(key)!;
            this.currentSize -= oldEntry.size;
        }

        // Enforce size limit with LRU eviction
        while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
            this.evictLRU();
        }

        // Add new entry
        this.cache.set(key, {
            value,
            lastAccessed: Date.now(),
            size
        });
        this.currentSize += size;
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (entry) {
            entry.lastAccessed = Date.now();
            return entry.value;
        }
        return undefined;
    }

    getSize(): number {
        return this.cache.size;
    }

    clear(): void {
        this.cache.clear();
        this.currentSize = 0;
    }

    private evictLRU(): void {
        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const entry = this.cache.get(oldestKey)!;
            this.currentSize -= entry.size;
            this.cache.delete(oldestKey);
        }
    }
}

/**
 * Factory function to create a cache service instance
 */
export function createCacheService(type: 'localStorage' | 'memory' = 'localStorage', prefix: string = 'app'): ICacheService {
    switch (type) {
        case 'memory':
            return new MemoryCacheService();
        case 'localStorage':
            return new LocalStorageCacheService(prefix);
        default:
            throw new Error(`Unknown cache service type: ${type}`);
    }
}