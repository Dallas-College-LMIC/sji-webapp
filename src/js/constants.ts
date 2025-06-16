import type { ZScoreCategory } from '../types/api';

export const MAP_CONFIG = {
    accessToken: "pk.eyJ1IjoiY2dpbGNocmllc3QtZGNjY2QiLCJhIjoiY200aXNueG5hMDV6czJtcTBweTFlZG9weSJ9.BV1l4NoP08wC2vlkhYR2Pg",
    style: "mapbox://styles/mapbox/light-v10",
    center: [-97.0336, 32.8999] as [number, number],
    zoom: 10.8,
    hash: true,
    attributionControl: true,
    customAttribution: '<b><a href="https://github.com/NYCPlanning/td-travelshed/blob/master/Transit%20Travelshed.pdf" target="_blank">Detailed Methodology</a></b>',
    preserveDrawingBuffer: true
} as const;

export const COLOR_SCHEMES = {
    zscoreCategories: [
        "<-2.5SD",
        "-2.5SD ~ -1.5SD", 
        "-1.5SD ~ -0.5SD",
        "-0.5SD ~ +0.5SD",
        "+0.5SD ~ +1.5SD",
        "+1.5SD ~ +2.5SD",
        ">=+2.5SD"
    ] as ZScoreCategory[],
    zscoreColors: [
        "rgba(43, 131, 186, 0.8)",
        "rgba(128, 191, 172, 0.8)",
        "rgba(199, 233, 173, 0.8)",
        "rgba(255, 255, 191, 0.8)",
        "rgba(254, 201, 128, 0.8)",
        "rgba(241, 124, 74, 0.8)",
        "rgba(215, 25, 28, 0.8)"
    ] as const,
    outlineColor: "rgba(0, 0, 0, 0.1)" as const
} as const;

export const BRANDING = {
    colors: {
        primary: "rgba(0, 51, 133, 1)",
        secondary: "rgba(229, 38, 38, 0.9)",
        secondaryHover: "rgba(229, 38, 38, 1)"
    },
    logoUrl: "https://raw.githubusercontent.com/Dallas-College-LMIC/spatial-jobs-index/e8094a75034b8627e629a350e0f1a2a81a0f468a/DCLOGO_RGB_MASTER_MARK-V-WHITE.png",
    homeUrl: "https://www.dallascollege.edu/business-industry/lmic/pages/default.aspx"
} as const;