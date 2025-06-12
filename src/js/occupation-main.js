import { OccupationMapController } from './occupation.js';
import '../styles/shared.css';

// Initialize the occupation map controller when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const occupationController = new OccupationMapController('mainmap');
    } catch (error) {
        console.error('Failed to initialize occupation map:', error);
        
        // Show user-friendly error message
        const container = document.getElementById('mainmap');
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa;">
                    <div style="text-align: center; padding: 2rem; max-width: 500px;">
                        <h3 style="color: #dc3545; margin-bottom: 1rem;">API Connection Error</h3>
                        <p style="color: #6c757d; margin-bottom: 1rem;">
                            Unable to connect to the data API. This application requires a backend API server to provide GeoJSON data.
                        </p>
                        <p style="color: #6c757d; font-size: 0.9rem;">
                            Expected API endpoint: <code>${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</code>
                        </p>
                        <p style="color: #6c757d; font-size: 0.9rem;">
                            Check the console for more details.
                        </p>
                    </div>
                </div>
            `;
        }
    }
});