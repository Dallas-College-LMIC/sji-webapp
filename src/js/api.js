export class ApiService {
    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    }

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            throw error;
        }
    }

    async getGeojsonData(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/geojson?${queryString}` : '/geojson';
        return this.fetchData(endpoint);
    }

    async getOccupationIds() {
        return this.fetchData('/occupation_ids');
    }

    getExportUrl(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return queryString ? `${this.baseUrl}/geojson?${queryString}` : `${this.baseUrl}/geojson`;
    }
}