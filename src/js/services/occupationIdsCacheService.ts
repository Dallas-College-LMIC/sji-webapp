import { ICacheService } from './cacheService';

/**
 * Simple cache service for occupation IDs with localStorage fallback
 */
export class OccupationIdsCacheService {
    private cacheService: ICacheService;
    private readonly CACHE_KEY = 'occupation_ids';
    private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

    constructor(cacheService: ICacheService) {
        this.cacheService = cacheService;
    }

    /**
     * Cache occupation IDs
     */
    cacheOccupationIds(occupationIds: string[]): void {
        this.cacheService.set(this.CACHE_KEY, occupationIds, this.CACHE_TTL);
    }

    /**
     * Get cached occupation IDs
     */
    getCachedOccupationIds(): string[] | null {
        return this.cacheService.get<string[]>(this.CACHE_KEY);
    }

    /**
     * Clear cached occupation IDs
     */
    clearCache(): void {
        this.cacheService.remove(this.CACHE_KEY);
    }
}