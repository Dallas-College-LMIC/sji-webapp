// Standalone version that doesn't use ES6 imports
class MapManager {
    constructor(containerId) {
        this.map = null;
        this.containerId = containerId;
        this.popup = null;
        this.initializeMap();
    }

    initializeMap() {
        mapboxgl.accessToken = "pk.eyJ1IjoiY2dpbGNocmllc3QtZGNjY2QiLCJhIjoiY200aXNueG5hMDV6czJtcTBweTFlZG9weSJ9.BV1l4NoP08wC2vlkhYR2Pg";
        
        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: "mapbox://styles/mapbox/light-v10",
            center: [-97.0336, 32.8999],
            zoom: 10.8,
            hash: true,
            attributionControl: true,
            customAttribution: '<b><a href="https://github.com/NYCPlanning/td-travelshed/blob/master/Transit%20Travelshed.pdf" target="_blank">Detailed Methodology</a></b>',
            preserveDrawingBuffer: true
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
        const COLOR_SCHEMES = {
            zscoreCategories: [
                "<-2.5SD",
                "-2.5SD ~ -1.5SD", 
                "-1.5SD ~ -0.5SD",
                "-0.5SD ~ +0.5SD",
                "+0.5SD ~ +1.5SD",
                "+1.5SD ~ +2.5SD",
                ">=+2.5SD"
            ],
            zscoreColors: [
                "rgba(43, 131, 186, 0.8)",
                "rgba(128, 191, 172, 0.8)",
                "rgba(199, 233, 173, 0.8)",
                "rgba(255, 255, 191, 0.8)",
                "rgba(254, 201, 128, 0.8)",
                "rgba(241, 124, 74, 0.8)",
                "rgba(215, 25, 28, 0.8)"
            ]
        };
        
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
                'fill-outline-color': "rgba(0, 0, 0, 0.1)"
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

// Make it globally available
window.MapManager = MapManager;