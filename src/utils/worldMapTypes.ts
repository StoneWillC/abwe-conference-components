// src/utils/worldMapTypes.ts
import type { Feature, Geometry } from "geojson";
import type { LatLngBounds, LatLng } from "leaflet";

// GeoJSON types (React Leaflet works directly with GeoJSON, no TopoJSON needed)
export interface CountryFeature extends Feature {
  geometry: Geometry;
  properties: {
    NAME?: string;
    NAME_EN?: string;
    ISO_A2?: string;
    ISO_A3?: string;
    ISO_N3?: string;
    UN_A3?: string;
    ADM0_A3?: string;
    ADMIN?: string;
    [key: string]: any;
  };
  id?: string | number;
}

export interface CountryCollection {
  type: "FeatureCollection";
  features: CountryFeature[];
}

// Country data types
export interface CountryData {
  [countryCode: string]: {
    value: number;
    name: string;
    color?: string;
  };
}

// Leaflet-specific types
export interface LeafletMapBounds {
  bounds: LatLngBounds;
  center: LatLng;
  zoom: number;
}

export interface CountryLayerStyle {
  fillColor: string;
  fillOpacity: number;
  color: string;
  weight: number;
  opacity: number;
}

export interface CountryLayerProps {
  feature: CountryFeature;
  data?: CountryData[string];
  style: CountryLayerStyle;
  onMouseOver?: (e: any) => void;
  onMouseOut?: (e: any) => void;
  onClick?: (e: any) => void;
}

// Component props - compatible with existing Dashboard interface
export interface WorldMapGraphProps {
  question: string;
  labels: string[];
  values: number[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  colorScheme?: "rainbow" | "blue" | "green" | "red";
  onCountryClick?: (countryCode: string, data: CountryData[string]) => void;
  onCountryHover?: (
    countryCode: string,
    data: CountryData[string] | null
  ) => void;
  // Leaflet-specific props
  initialCenter?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
  attributionControl?: boolean;
}

// Tooltip/Popup types
export interface CountryTooltipProps {
  countryName: string;
  value: number;
  position: [number, number];
  visible: boolean;
}

export interface CountryPopupProps {
  feature: CountryFeature;
  data: CountryData[string];
}

// Map control types
export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleLabels?: () => void;
  showLabels?: boolean;
}

// Color scheme utilities
export interface ColorScale {
  domain: [number, number];
  range: string[];
  getColor: (value: number) => string;
}

// Event types
export interface CountryInteractionEvent {
  countryCode: string;
  countryName: string;
  value: number;
  coordinates: [number, number];
  feature: CountryFeature;
}

// Centroid calculation (for labels)
export interface CountryCentroid {
  countryCode: string;
  centroid: [number, number];
  value: number;
  name: string;
}

// Map theme types
export interface MapTheme {
  backgroundColor: string;
  oceanColor: string;
  countryStroke: string;
  countryStrokeWidth: number;
  hoverStrokeColor: string;
  hoverStrokeWidth: number;
}

// Legend types
export interface LegendItem {
  color: string;
  value: number;
  label: string;
}

export interface MapLegendProps {
  items: LegendItem[];
  title: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}
