/// <reference types="vite/client" />
/// <reference types="jquery" />
/// <reference types="select2" />
/// <reference types="mapbox-gl" />

// Global type declarations

// Declare mapboxgl as global since it's loaded from CDN
declare global {
  const mapboxgl: typeof import('mapbox-gl');
  
  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
  }
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};