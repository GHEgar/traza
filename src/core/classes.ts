import type { RoadClass } from './types.js';

export const ROAD_CLASSES: readonly RoadClass[] = ['motorway', 'primary', 'secondary', 'tertiary', 'residential', 'path'];

const OSM_HIGHWAY: Record<string, RoadClass> = {
    motorway: 'motorway',
    motorway_link: 'motorway',
    trunk: 'motorway',
    trunk_link: 'motorway',
    primary: 'primary',
    primary_link: 'primary',
    secondary: 'secondary',
    secondary_link: 'secondary',
    tertiary: 'tertiary',
    tertiary_link: 'tertiary',
    residential: 'residential',
    unclassified: 'residential',
    living_street: 'residential',
    service: 'residential',
    road: 'residential',
    pedestrian: 'path',
    footway: 'path',
    path: 'path',
    cycleway: 'path',
    steps: 'path',
    track: 'path',
    bridleway: 'path',
};

export const osmRoadClass = (highway: string | undefined): RoadClass | null => {
    if (highway === undefined) {
        return null;
    }
    return OSM_HIGHWAY[highway] ?? null;
};
