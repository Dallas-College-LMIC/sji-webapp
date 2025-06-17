import type { GeoJSONResponse } from '../../types/api';
import { ICacheService } from './cacheService';

/**
 * Cache statistics for performance monitoring
 */
export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    memoryUsage: number;
    totalRequests: number;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry {
    data: GeoJSONResponse;
    lastAccessed: number;
    accessCount: number;
    size: number;
}

/**
 * Configuration for the occupation cache
 */
export interface OccupationCacheConfig {
    maxMemoryEntries: number;
    maxMemorySize: number; // in bytes
    persistentCacheTTL: number; // in seconds
    enablePersistence: boolean;
}

/**
 * High-performance occupation cache with LRU eviction and persistence
 */
export class OccupationCacheService {
    private memoryCache = new Map<string, CacheEntry>();
    private persistentCache: ICacheService;
    private config: OccupationCacheConfig;
    private stats: CacheStats;

    constructor(persistentCache: ICacheService, config: Partial<OccupationCacheConfig> = {}) {
        this.persistentCache = persistentCache;
        this.config = {
            maxMemoryEntries: 50,
            maxMemorySize: 500 * 1024 * 1024, // 500MB
            persistentCacheTTL: 7 * 24 * 60 * 60, // 7 days
            enablePersistence: true,
            ...config
        };
        
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            memoryUsage: 0,
            totalRequests: 0
        };
    }

    /**
     * Get occupation data from cache (memory first, then persistent)
     */
    async get(occupationId: string): Promise<GeoJSONResponse | null> {
        this.stats.totalRequests++;

        // Check memory cache first
        const memoryEntry = this.memoryCache.get(occupationId);
        if (memoryEntry) {
            // Update access metadata
            memoryEntry.lastAccessed = Date.now();
            memoryEntry.accessCount++;
            this.stats.hits++;
            
            console.log(`[OccupationCache] Memory hit for ${occupationId}`);
            return memoryEntry.data;
        }

        // Check persistent cache
        if (this.config.enablePersistence) {
            const persistentData = this.persistentCache.get<GeoJSONResponse>(`occupation_${occupationId}`);
            if (persistentData) {
                // Move to memory cache
                await this.setMemoryCache(occupationId, persistentData);
                this.stats.hits++;
                
                console.log(`[OccupationCache] Persistent hit for ${occupationId}`);
                return persistentData;
            }
        }

        this.stats.misses++;
        console.log(`[OccupationCache] Cache miss for ${occupationId}`);
        return null;
    }

    /**
     * Store occupation data in both memory and persistent cache
     */
    async set(occupationId: string, data: GeoJSONResponse): Promise<void> {
        // Store in memory cache
        await this.setMemoryCache(occupationId, data);

        // Store in persistent cache
        if (this.config.enablePersistence) {
            this.persistentCache.set(`occupation_${occupationId}`, data, this.config.persistentCacheTTL);
        }
    }

    /**
     * Store data in memory cache with LRU eviction
     */
    private async setMemoryCache(occupationId: string, data: GeoJSONResponse): Promise<void> {
        const dataSize = this.estimateSize(data);
        
        // Check if we need to evict entries
        await this.enforceMemoryLimits(dataSize);

        // Create cache entry
        const entry: CacheEntry = {
            data,
            lastAccessed: Date.now(),
            accessCount: 1,
            size: dataSize
        };

        this.memoryCache.set(occupationId, entry);
        this.updateMemoryUsage();
    }

    /**
     * Enforce memory limits by evicting LRU entries
     */
    private async enforceMemoryLimits(newEntrySize: number): Promise<void> {
        // Check entry count limit
        while (this.memoryCache.size >= this.config.maxMemoryEntries) {
            this.evictLRU();
        }

        // Check memory size limit
        while (this.stats.memoryUsage + newEntrySize > this.config.maxMemorySize) {
            this.evictLRU();
        }
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
            this.stats.evictions++;
            this.updateMemoryUsage();
            console.log(`[OccupationCache] Evicted ${oldestKey} (LRU)`);
        }
    }

    /**
     * Estimate size of GeoJSON data
     */
    private estimateSize(data: GeoJSONResponse): number {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch {
            // Fallback estimation
            return data.features.length * 6000; // ~6KB per feature average
        }
    }

    /**
     * Update memory usage statistics
     */
    private updateMemoryUsage(): void {
        let totalSize = 0;
        for (const entry of this.memoryCache.values()) {
            totalSize += entry.size;
        }
        this.stats.memoryUsage = totalSize;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Clear all caches
     */
    clear(): void {
        this.memoryCache.clear();
        this.persistentCache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            memoryUsage: 0,
            totalRequests: 0
        };
    }

    /**
     * Get cache info for debugging
     */
    getDebugInfo(): any {
        return {
            memoryEntries: this.memoryCache.size,
            memoryUsageMB: Math.round(this.stats.memoryUsage / (1024 * 1024)),
            hitRate: this.stats.totalRequests > 0 ? 
                Math.round((this.stats.hits / this.stats.totalRequests) * 100) : 0,
            config: this.config,
            stats: this.stats
        };
    }
}