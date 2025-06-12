// Standalone version that doesn't use ES6 imports
class ApiService {
    constructor() {
        this.baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:8000';
        this.username = window.CONFIG?.API_USERNAME || '';
        this.password = window.CONFIG?.API_PASSWORD || '';
    }

    getAuthHeaders() {
        return {
            'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
        };
    }

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: this.getAuthHeaders()
            });

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

// Make it globally available
window.ApiService = ApiService;