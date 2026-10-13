import { buildNetwork, distance } from '../core/index.js';
import type { AreaFeature, AreaKind, LonLat, NetworkLine, RoadClass, StreetNetwork } from '../core/index.js';

export interface GeoJsonGeometry {
    type: string;
    coordinates?: unknown;
}

export interface GeoJsonFeature {
    type: 'Feature';
    id?: string | number;
    geometry: GeoJsonGeometry | null;
    properties: Record<string, unknown> | null;
}

export interface GeoJsonCollection {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
}

export type PropertyReader<T> = (properties: Record<string, unknown>) => T;

export interface GeoJsonNetworkOptions {
    name?: string | PropertyReader<string | null>;
    roadClass?: RoadClass | PropertyReader<RoadClass | null>;
    tolerance?: number;
    idPrefix?: string;
}

const METERS_PER_DEGREE = 111_320;

export const createSnapper = (tolerance: number, prefix: string): ((coord: LonLat) => string) => {
    const dLat = Math.max(tolerance, 1e-3) / METERS_PER_DEGREE;
    const cells = new Map<string, { id: string; coord: LonLat }[]>();
    let next = 0;
    const dLonOf = (row: number): number => dLat / Math.max(Math.cos((row + 0.5) * dLat * Math.PI / 180), 1e-6);
    return (coord: LonLat): string => {
        const row = Math.floor(coord[1] / dLat);
        for (let dr = -1; dr <= 1; dr++) {
            const r = row + dr;
            const col = Math.floor(coord[0] / dLonOf(r));
            for (let dc = -1; dc <= 1; dc++) {
                const found = cells.get(`${r}:${col + dc}`)?.find((node) => distance(node.coord, coord) <= tolerance);
                if (found) {
                    return found.id;
                }
            }
        }
        const key = `${row}:${Math.floor(coord[0] / dLonOf(row))}`;
        const id = `${prefix}${next++}`;
        cells.set(key, [...(cells.get(key) ?? []), { id, coord }]);
        return id;
    };
};

const linesOf = (geometry: GeoJsonGeometry | null): LonLat[][] => {
    if (geometry?.type === 'LineString') {
        return [geometry.coordinates as LonLat[]];
    }
    if (geometry?.type === 'MultiLineString') {
        return geometry.coordinates as LonLat[][];
    }
    return [];
};

const readerOf = <T>(value: T | PropertyReader<T> | undefined, fallback: PropertyReader<T>): PropertyReader<T> => {
    if (typeof value === 'function') {
        return value as PropertyReader<T>;
    }
    return value === undefined ? fallback : () => value;
};

export const fromGeoJSON = (collection: GeoJsonCollection, options: GeoJsonNetworkOptions = {}): StreetNetwork => {
    const prefix = options.idPrefix ?? 'g';
    const snap = createSnapper(options.tolerance ?? 1, `${prefix}n`);
    const readName = typeof options.name === 'string'
        ? (properties: Record<string, unknown>) => {
            const value = properties[options.name as string];
            return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
        }
        : readerOf<string | null>(options.name, () => null);
    const readClass = readerOf<RoadClass | null>(options.roadClass, () => 'residential');
    const lines: NetworkLine[] = [];
    collection.features.forEach((feature, index) => {
        const properties = feature.properties ?? {};
        const roadClass = readClass(properties);
        if (!roadClass) {
            return;
        }
        linesOf(feature.geometry).forEach((raw, part) => {
            const coords = raw.map(([lon, lat]) => [lon, lat] as LonLat);
            lines.push({
                id: `${prefix}${feature.id ?? index}.${part}`,
                nodeIds: coords.map(snap),
                coords,
                roadClass,
                name: readName(properties),
                tags: Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, String(value)])),
            });
        });
    });
    return buildNetwork(lines, ['custom']);
};

export const areasFromGeoJSON = (collection: GeoJsonCollection, kind: AreaKind): AreaFeature[] => {
    const areas: AreaFeature[] = [];
    for (const feature of collection.features) {
        const geometry = feature.geometry;
        if (geometry?.type === 'Polygon') {
            areas.push({ kind, rings: geometry.coordinates as LonLat[][] });
        }
        if (geometry?.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates as LonLat[][][]) {
                areas.push({ kind, rings: polygon });
            }
        }
    }
    return areas;
};
