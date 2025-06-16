import mapboxgl from 'mapbox-gl';

// Re-export commonly used Mapbox types with cleaner aliases
export type MapboxMap = mapboxgl.Map;
export type MapboxPopup = mapboxgl.Popup;
export type MapboxLngLat = mapboxgl.LngLat;
export type MapboxLngLatLike = mapboxgl.LngLatLike;
export type MapboxMapMouseEvent = mapboxgl.MapMouseEvent;
export type MapboxMapLayerMouseEvent = mapboxgl.MapLayerMouseEvent;
export type MapboxGeoJSONSource = mapboxgl.GeoJSONSource;
export type MapboxGeoJSONSourceOptions = mapboxgl.GeoJSONSourceOptions;
export type MapboxNavigationControl = mapboxgl.NavigationControl;
export type MapboxFullscreenControl = mapboxgl.FullscreenControl;
export type MapboxEventData = mapboxgl.EventData;
export type MapboxErrorEvent = mapboxgl.ErrorEvent;

// Layer types
export type MapboxLayer = mapboxgl.Layer;
export type MapboxFillLayer = mapboxgl.FillLayer;
export type MapboxLineLayer = mapboxgl.LineLayer;
export type MapboxSymbolLayer = mapboxgl.SymbolLayer;
export type MapboxCircleLayer = mapboxgl.CircleLayer;
export type MapboxHeatmapLayer = mapboxgl.HeatmapLayer;
export type MapboxFillExtrusionLayer = mapboxgl.FillExtrusionLayer;
export type MapboxRasterLayer = mapboxgl.RasterLayer;
export type MapboxHillshadeLayer = mapboxgl.HillshadeLayer;
export type MapboxBackgroundLayer = mapboxgl.BackgroundLayer;

// Paint and layout property types
export type MapboxFillPaint = mapboxgl.FillPaint;
export type MapboxFillLayout = mapboxgl.FillLayout;
export type MapboxLinePaint = mapboxgl.LinePaint;
export type MapboxLineLayout = mapboxgl.LineLayout;
export type MapboxSymbolPaint = mapboxgl.SymbolPaint;
export type MapboxSymbolLayout = mapboxgl.SymbolLayout;
export type MapboxCirclePaint = mapboxgl.CirclePaint;
export type MapboxCircleLayout = mapboxgl.CircleLayout;

// Expression types
export type MapboxExpression = mapboxgl.Expression;
export type MapboxStyleFunction = mapboxgl.StyleFunction;

// Source types
export type MapboxAnySource = mapboxgl.Source;
export type MapboxAnySourceData = mapboxgl.AnySourceData;
export type MapboxGeoJSONSourceRaw = mapboxgl.GeoJSONSourceRaw;
export type MapboxVectorSource = mapboxgl.VectorSource;
export type MapboxRasterSource = mapboxgl.RasterSource;
export type MapboxRasterDemSource = mapboxgl.RasterDemSource;
export type MapboxImageSource = mapboxgl.ImageSource;
export type MapboxVideoSource = mapboxgl.VideoSource;
export type MapboxCanvasSource = mapboxgl.CanvasSource;

// Style types
export type MapboxStyle = mapboxgl.Style;
export type MapboxStyleOptions = mapboxgl.StyleOptions;

// Control position types
export type MapboxControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Custom interfaces for the SJI webapp
export interface ChoroplethLayerConfig {
  id: string;
  sourceId: string;
  sourceLayer?: string;
  paint: MapboxFillPaint;
  layout?: MapboxFillLayout;
  beforeId?: string;
}

export interface ChoroplethOutlineLayerConfig {
  id: string;
  sourceId: string;
  sourceLayer?: string;
  paint: MapboxLinePaint;
  layout?: MapboxLineLayout;
  beforeId?: string;
}

export interface MapClickEvent extends MapboxMapLayerMouseEvent {
  features?: mapboxgl.MapboxGeoJSONFeature[];
}

export interface MapLoadEvent {
  target: MapboxMap;
  type: 'load';
}

export interface MapErrorEvent {
  error: Error;
  target: MapboxMap;
  type: 'error';
}

export interface LayerVisibilityOptions {
  layerId: string;
  visibility: 'visible' | 'none';
}

export interface PopupOptions {
  coordinates: MapboxLngLatLike;
  html: string;
  className?: string;
  offset?: mapboxgl.PointLike;
  closeButton?: boolean;
  closeOnClick?: boolean;
  closeOnMove?: boolean;
  focusAfterOpen?: boolean;
  anchor?: mapboxgl.Anchor;
  maxWidth?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewState {
  center: MapboxLngLatLike;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// Type guards
export function isGeoJSONSource(source: MapboxAnySource | undefined): source is MapboxGeoJSONSource {
  return source?.type === 'geojson';
}

export function isFillLayer(layer: MapboxLayer): layer is MapboxFillLayer {
  return layer.type === 'fill';
}

export function isLineLayer(layer: MapboxLayer): layer is MapboxLineLayer {
  return layer.type === 'line';
}

export function isSymbolLayer(layer: MapboxLayer): layer is MapboxSymbolLayer {
  return layer.type === 'symbol';
}

export function isCircleLayer(layer: MapboxLayer): layer is MapboxCircleLayer {
  return layer.type === 'circle';
}

// Utility types for expressions
export type ColorExpression = string | MapboxExpression;
export type NumberExpression = number | MapboxExpression;
export type BooleanExpression = boolean | MapboxExpression;
export type StringExpression = string | MapboxExpression;

// Z-score category types specific to SJI webapp
export type ZScoreCategory = '-2.5' | '-1.5' | '-0.5' | '0.5' | '1.5' | '2.5';

export interface ZScoreCategoryColors {
  '-2.5': string;
  '-1.5': string;
  '-0.5': string;
  '0.5': string;
  '1.5': string;
  '2.5': string;
}

// Feature properties interface for census tracts
export interface CensusTractProperties {
  GEOID: string;
  [key: string]: any; // Dynamic properties for different z-score fields
}

export interface CensusTractFeature extends GeoJSON.Feature<GeoJSON.Geometry, CensusTractProperties> {
  id?: string | number;
}

export interface CensusTractFeatureCollection extends GeoJSON.FeatureCollection<GeoJSON.Geometry, CensusTractProperties> {
  features: CensusTractFeature[];
}

// Map initialization options
export interface MapInitOptions {
  container: string | HTMLElement;
  style: string;
  center: MapboxLngLatLike;
  zoom: number;
  maxBounds?: mapboxgl.LngLatBoundsLike;
  minZoom?: number;
  maxZoom?: number;
  bearing?: number;
  pitch?: number;
  interactive?: boolean;
  hash?: boolean;
  attributionControl?: boolean;
  customAttribution?: string | string[];
  logoPosition?: MapboxControlPosition;
  failIfMajorPerformanceCaveat?: boolean;
  preserveDrawingBuffer?: boolean;
  antialias?: boolean;
  refreshExpiredTiles?: boolean;
  bounds?: mapboxgl.LngLatBoundsLike;
  fitBoundsOptions?: mapboxgl.FitBoundsOptions;
  trackResize?: boolean;
  renderWorldCopies?: boolean;
  bearingSnap?: number;
  pitchWithRotate?: boolean;
  clickTolerance?: number;
  fadeDuration?: number;
  crossSourceCollisions?: boolean;
  accessToken?: string;
  locale?: any;
  testMode?: boolean;
}