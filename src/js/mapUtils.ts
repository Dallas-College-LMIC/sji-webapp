/* global mapboxgl */

import { MAP_CONFIG, COLOR_SCHEMES } from './constants';
import type { GeoJSONResponse } from '../types/api';
import type { 
    MapboxMap, 
    MapboxPopup, 
    MapboxMapLayerMouseEvent,
    MapboxFullscreenControl,
    MapboxNavigationControl,
    MapboxExpression,
    MapboxControlPosition
} from '../types/mapbox';
import { isGeoJSONSource } from '../types/mapbox';

export class MapManager {
    public map!: MapboxMap;
    private containerId: string;
    private popup!: MapboxPopup;

    constructor(containerId: string) {
        this.containerId = containerId;
        this.initializeMap();
    }

    private initializeMap(): void {
        mapboxgl.accessToken = MAP_CONFIG.accessToken;
        
        this.map = new mapboxgl.Map({
            container: this.containerId,
            ...MAP_CONFIG
        });

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
        const fullscreenControl = new mapboxgl.FullscreenControl({
            container: document.querySelector("body") as HTMLElement
        }) as MapboxFullscreenControl;
        
        this.map.addControl(
            fullscreenControl,
            "bottom-left" as MapboxControlPosition
        );

        const navigationControl = new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        }) as MapboxNavigationControl;

        this.map.addControl(
            navigationControl,
            "bottom-left" as MapboxControlPosition
        );
    }

    addSource(sourceId: string, data: GeoJSONResponse | { type: string; features: GeoJSON.Feature[] }): void {
        const source = this.map.getSource(sourceId);
        
        if (source && isGeoJSONSource(source)) {
            source.setData(data as GeoJSON.FeatureCollection<GeoJSON.Geometry> | GeoJSON.Feature<GeoJSON.Geometry> | String);
        } else {
            this.map.addSource(sourceId, {
                type: "geojson",
                data: data as GeoJSON.FeatureCollection<GeoJSON.Geometry> | GeoJSON.Feature<GeoJSON.Geometry> | string
            });
        }
    }

    private createLayerColor(propertyName: string): MapboxExpression {
        const layerColor: MapboxExpression = ["match", ["get", propertyName]];
        
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
                'fill-color': this.createLayerColor(propertyName),
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
        this.map.on('click', layerId, (e: MapboxMapLayerMouseEvent) => {
            const coordinates = e.lngLat;
            const features = e.features;
            
            if (!features || features.length === 0) {
                return;
            }
            
            const firstFeature = features[0];
            const properties = firstFeature?.properties;
            if (!properties) {
                return;
            }
            
            const score = properties[scoreProperty] as number | undefined;
            
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