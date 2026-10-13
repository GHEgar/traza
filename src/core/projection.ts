import { EARTH_RADIUS, toRadians } from './geo.js';
import type { LonLat, Point } from './types.js';

export interface Projection {
    center: LonLat;
    forward: (coord: LonLat) => Point;
}

export const createProjection = (center: LonLat): Projection => {
    const phi0 = toRadians(center[1]);
    const lambda0 = toRadians(center[0]);
    const sinPhi0 = Math.sin(phi0);
    const cosPhi0 = Math.cos(phi0);
    const forward = ([lon, lat]: LonLat): Point => {
        const phi = toRadians(lat);
        const dLambda = toRadians(lon) - lambda0;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const cosC = Math.max(-1, Math.min(1, sinPhi0 * sinPhi + cosPhi0 * cosPhi * Math.cos(dLambda)));
        const c = Math.acos(cosC);
        const k = c < 1e-12 ? 1 : c / Math.sin(c);
        return [
            EARTH_RADIUS * k * cosPhi * Math.sin(dLambda),
            EARTH_RADIUS * k * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * Math.cos(dLambda)),
        ];
    };
    return { center, forward };
};
