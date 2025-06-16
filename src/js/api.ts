import type { OccupationIdsResponse, GeoJSONResponse } from '../types/api';

export class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    }

    async fetchData<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json() as T;
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            throw error;
        }
    }

    async getGeojsonData(params: Record<string, string> = {}): Promise<GeoJSONResponse> {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/geojson?${queryString}` : '/geojson';
        return this.fetchData<GeoJSONResponse>(endpoint);
    }

    async getOccupationIds(): Promise<OccupationIdsResponse> {
        return this.fetchData<OccupationIdsResponse>('/occupation_ids');
    }

    getExportUrl(params: Record<string, string> = {}): string {
        const queryString = new URLSearchParams(params).toString();
        return queryString ? `${this.baseUrl}/geojson?${queryString}` : `${this.baseUrl}/geojson`;
    }
}