// API Response Types

export interface OccupationIdsResponse {
  occupation_ids: string[];
}

export interface GeoJSONProperties {
  GEOID: string;
  [key: string]: string | number | null; // Dynamic properties for z-scores
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][]; // GeoJSON coordinate arrays
  };
  properties: GeoJSONProperties;
}

export interface GeoJSONResponse {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Z-score categories
export type ZScoreCategory = 
  | '<-2.5SD'
  | '-2.5SD ~ -1.5SD'
  | '-1.5SD ~ -0.5SD'
  | '-0.5SD ~ +0.5SD'
  | '+0.5SD ~ +1.5SD'
  | '+1.5SD ~ +2.5SD'
  | '>=+2.5SD';

export interface LayerConfig {
  id: string;
  visibility: 'visible' | 'none';
  property: string;
  title: string;
  scoreProperty: string;
}