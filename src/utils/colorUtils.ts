// src/utils/colorUtils.ts
import { scaleLinear, scaleSequential } from 'd3-scale';
import { 
  interpolateBlues, 
  interpolateGreens, 
  interpolateReds,
  interpolateViridis,
  interpolateRainbow
} from 'd3-scale-chromatic';

export type ColorScheme = 'rainbow' | 'blue' | 'green' | 'red' | 'viridis';

/**
 * Generate a color based on a value within a range
 */
export function getColorFromValue(
  value: number,
  minValue: number,
  maxValue: number,
  scheme: ColorScheme = 'rainbow'
): string {
  // Handle edge cases
  if (minValue === maxValue) {
    return getSchemeColor(scheme, 0.5);
  }
  
  // Normalize value to 0-1 range
  const normalizedValue = Math.max(0, Math.min(1, (value - minValue) / (maxValue - minValue)));
  
  return getSchemeColor(scheme, normalizedValue);
}

/**
 * Get color from scheme at normalized position (0-1)
 */
function getSchemeColor(scheme: ColorScheme, position: number): string {
  switch (scheme) {
    case 'blue':
      return interpolateBlues(position);
    case 'green':
      return interpolateGreens(position);
    case 'red':
      return interpolateReds(position);
    case 'viridis':
      return interpolateViridis(position);
    case 'rainbow':
    default:
      return interpolateRainbow(position);
  }
}

/**
 * Generate an array of colors for a given scheme
 */
export function generateColorArray(count: number, scheme: ColorScheme = 'rainbow'): string[] {
  return Array.from({ length: count }, (_, i) => 
    getSchemeColor(scheme, i / Math.max(1, count - 1))
  );
}

/**
 * Create a linear color scale
 */
export function createColorScale(
  domain: [number, number],
  scheme: ColorScheme = 'rainbow'
) {
  const interpolator = getSchemeInterpolator(scheme);
  return scaleSequential(interpolator).domain(domain);
}

/**
 * Get D3 interpolator for scheme
 */
function getSchemeInterpolator(scheme: ColorScheme) {
  switch (scheme) {
    case 'blue':
      return interpolateBlues;
    case 'green':
      return interpolateGreens;
    case 'red':
      return interpolateReds;
    case 'viridis':
      return interpolateViridis;
    case 'rainbow':
    default:
      return interpolateRainbow;
  }
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Simple linear red->blue (kept if you still want it)
export const interpolateColor = (value: number) => {
  const v = Math.max(0, Math.min(100, value)) / 100;
  const r = Math.round(255 * (1 - v));
  const g = 0;
  const b = Math.round(255 * v);
  return `rgb(${r},${g},${b})`;
};

// Rainbow (ROYGBIV) using HSL hue
export const rainbowColor = (value: number) => {
  const v = Math.max(0, Math.min(100, value)) / 100; // clamp 0–100
  const hue = v * 300; // 0 = red, 300 = violet
  return `hsl(${hue}, 100%, 50%)`;
};
