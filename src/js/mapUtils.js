import { MAP_CONFIG, COLOR_SCHEMES } from './constants.js';

export class MapManager {
    constructor(containerId) {
        this.map = null;
        this.containerId = containerId;
        this.popup = null;
        this.initializeMap();
    }

    initializeMap() {
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

    addControls() {
        this.map.addControl(
            new mapboxgl.FullscreenControl({
                container: document.querySelector("body")
            }),
            "bottom-left"
        );

        this.map.addControl(
            new mapboxgl.NavigationControl({
                showCompass: true,
                showZoom: true,
                visualizePitch: true
            }),
            "bottom-left"
        );
    }

    addSource(sourceId, data) {
        if (this.map.getSource(sourceId)) {
            this.map.getSource(sourceId).setData(data);
        } else {
            this.map.addSource(sourceId, {
                type: "geojson",
                data: data
            });
        }
    }

    createLayerColor(propertyName) {
        const layerColor = ["match", ["get", propertyName]];
        
        COLOR_SCHEMES.zscoreCategories.forEach((category, index) => {
            layerColor.push(category, COLOR_SCHEMES.zscoreColors[index]);
        });
        
        layerColor.push("#000000"); // fallback color
        return layerColor;
    }

    addLayer(layerId, sourceId, propertyName, visibility = 'visible') {
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

    setLayerVisibility(layerId, visibility) {
        if (this.map.getLayer(layerId)) {
            this.map.setLayoutProperty(layerId, 'visibility', visibility);
        }
    }

    addPopupEvents(layerId, title, scoreProperty) {
        this.map.on('click', layerId, (e) => {
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

    onStyleLoad(callback) {
        this.map.on('style.load', callback);
    }
}