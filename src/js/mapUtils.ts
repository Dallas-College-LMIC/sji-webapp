import { MAP_CONFIG, COLOR_SCHEMES } from './constants';
import type { GeoJSONResponse } from '../types/api';

export class MapManager {
    public map!: any; // mapboxgl.Map
    private containerId: string;
    private popup!: any; // mapboxgl.Popup

    constructor(containerId: string) {
        this.containerId = containerId;
        this.initializeMap();
    }

    private initializeMap(): void {
        // @ts-ignore - mapboxgl is loaded from CDN
        mapboxgl.accessToken = MAP_CONFIG.accessToken;
        
        // @ts-ignore - mapboxgl is loaded from CDN
        this.map = new mapboxgl.Map({
            container: this.containerId,
            ...MAP_CONFIG
        });

        // @ts-ignore - mapboxgl is loaded from CDN
        this.popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            anchor: "bottom",
            offset: 0,
            maxWidth: "none"
        });

        this.addControls();
    }

    private addControls(): void {
        this.map.addControl(
            // @ts-ignore - mapboxgl is loaded from CDN
            new mapboxgl.FullscreenControl({
                container: document.querySelector("body") as HTMLElement
            }),
            "bottom-left"
        );

        this.map.addControl(
            // @ts-ignore - mapboxgl is loaded from CDN
            new mapboxgl.NavigationControl({
                showCompass: true,
                showZoom: true,
                visualizePitch: true
            }),
            "bottom-left"
        );
    }

    addSource(sourceId: string, data: GeoJSONResponse | { type: string; features: any[] }): void {
        if (this.map.getSource(sourceId)) {
            (this.map.getSource(sourceId) as any).setData(data as any);
        } else {
            this.map.addSource(sourceId, {
                type: "geojson",
                data: data as any
            });
        }
    }

    private createLayerColor(propertyName: string): any[] {
        const layerColor: any[] = ["match", ["get", propertyName]];
        
        COLOR_SCHEMES.zscoreCategories.forEach((category, index) => {
            layerColor.push(category, COLOR_SCHEMES.zscoreColors[index]);
        });
        
        layerColor.push("#000000"); // fallback color
        return layerColor;
    }

    addLayer(layerId: string, sourceId: string, propertyName: string, visibility: 'visible' | 'none' = 'visible'): void {
        if (this.map.getLayer(layerId)) {
            this.map.removeLayer(layerId);
        }

        this.map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            layout: {
                visibility: visibility
            },
            paint: {
                'fill-color': this.createLayerColor(propertyName) as any,
                'fill-outline-color': COLOR_SCHEMES.outlineColor
            }
        });
    }

    setLayerVisibility(layerId: string, visibility: 'visible' | 'none'): void {
        if (this.map.getLayer(layerId)) {
            this.map.setLayoutProperty(layerId, 'visibility', visibility);
        }
    }

    addPopupEvents(layerId: string, title: string, scoreProperty: string): void {
        this.map.on('click', layerId, (e: any) => {
            const coordinates = e.lngLat;
            const properties = e.features[0].properties;
            const score = properties[scoreProperty];
            
            const description = `
                <b>Tract: </b><span>${properties.GEOID}</span><br>
                <b>${title}: </b><span>${score ? score.toFixed(2) : 'N/A'}</span>
            `;
            
            this.popup
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(this.map);
        });

        this.map.on('mouseenter', layerId, () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', layerId, () => {
            this.map.getCanvas().style.cursor = '';
        });
    }

    onStyleLoad(callback: () => void): void {
        this.map.on('style.load', callback);
    }
}