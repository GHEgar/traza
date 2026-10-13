import type { LonLat } from '../core/index.js';

export interface CoordinateLabels {
    north: string;
    south: string;
    east: string;
    west: string;
}

export interface CoordinateFormat {
    decimals?: number;
    labels?: CoordinateLabels;
    separator?: string;
}

export const formatCoordinates = ([lon, lat]: LonLat, options: CoordinateFormat = {}): string => {
    const decimals = options.decimals ?? 4;
    const labels = options.labels ?? { north: 'N', south: 'S', east: 'E', west: 'W' };
    const latText = `${Math.abs(lat).toFixed(decimals)}° ${lat >= 0 ? labels.north : labels.south}`;
    const lonText = `${Math.abs(lon).toFixed(decimals)}° ${lon >= 0 ? labels.east : labels.west}`;
    return `${latText}${options.separator ?? ' · '}${lonText}`;
};
