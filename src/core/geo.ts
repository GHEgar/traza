import type { BBox, LonLat } from './types.js';

export const EARTH_RADIUS = 6371008.8;

export const toRadians = (degrees: number): number => degrees * Math.PI / 180;

export const toDegrees = (radians: number): number => radians * 180 / Math.PI;

export const distance = (a: LonLat, b: LonLat): number => {
    const phi1 = toRadians(a[1]);
    const phi2 = toRadians(b[1]);
    const dPhi = phi2 - phi1;
    const dLambda = toRadians(b[0] - a[0]);
    const h = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
    return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const lineLength = (coords: LonLat[]): number => {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
        total += distance(coords[i - 1] as LonLat, coords[i] as LonLat);
    }
    return total;
};

export const bearing = (a: LonLat, b: LonLat): number => {
    const phi1 = toRadians(a[1]);
    const phi2 = toRadians(b[1]);
    const dLambda = toRadians(b[0] - a[0]);
    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

export const bboxOf = (coords: Iterable<LonLat>): BBox => {
    let minLon = Infinity;
    let minLat = Infinity;
    let maxLon = -Infinity;
    let maxLat = -Infinity;
    for (const [lon, lat] of coords) {
        minLon = Math.min(minLon, lon);
        minLat = Math.min(minLat, lat);
        maxLon = Math.max(maxLon, lon);
        maxLat = Math.max(maxLat, lat);
    }
    return [minLon, minLat, maxLon, maxLat];
};

export const bboxArea = (bbox: BBox): number => {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const width = toRadians(maxLon - minLon);
    return EARTH_RADIUS ** 2 * width * Math.abs(Math.sin(toRadians(maxLat)) - Math.sin(toRadians(minLat)));
};

export const ringArea = (ring: LonLat[]): number => {
    let total = 0;
    for (let i = 0; i < ring.length; i++) {
        const a = ring[i] as LonLat;
        const b = ring[(i + 1) % ring.length] as LonLat;
        total += toRadians(b[0] - a[0]) * (2 + Math.sin(toRadians(a[1])) + Math.sin(toRadians(b[1])));
    }
    return Math.abs(total * EARTH_RADIUS ** 2 / 2);
};

export const bboxAround = (center: LonLat, radius: number): BBox => {
    const dLat = toDegrees(radius / EARTH_RADIUS);
    const dLon = dLat / Math.max(Math.cos(toRadians(center[1])), 1e-6);
    return [center[0] - dLon, center[1] - dLat, center[0] + dLon, center[1] + dLat];
};
