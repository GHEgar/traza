import { buildNetwork, osmRoadClass } from '../core/index.js';
import type { AreaFeature, AreaKind, Extras, LonLat, NetworkLine, StreetNetwork, WaterLine } from '../core/index.js';

interface OverpassPoint {
    lat: number;
    lon: number;
}

interface OverpassMember {
    type: string;
    ref: number;
    role: string;
    geometry?: (OverpassPoint | null)[];
}

export interface OverpassElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    tags?: Record<string, string>;
    nodes?: number[];
    geometry?: (OverpassPoint | null)[];
    members?: OverpassMember[];
}

export interface OverpassResponse {
    elements: OverpassElement[];
}

export interface OsmData {
    network: StreetNetwork;
    extras: Extras;
}

const WATERWAY_LINES = new Set(['river', 'canal', 'stream', 'drain']);

const toCoords = (geometry: (OverpassPoint | null)[] | undefined): LonLat[] | null => {
    if (!geometry || geometry.some((point) => point === null)) {
        return null;
    }
    return (geometry as OverpassPoint[]).map((point) => [point.lon, point.lat]);
};

export const areaKindOf = (tags: Record<string, string>): AreaKind | null => {
    if (tags.natural === 'water' || tags.waterway === 'riverbank' || tags.landuse === 'reservoir' || tags.landuse === 'basin') {
        return 'water';
    }
    if (['park', 'garden', 'nature_reserve'].includes(tags.leisure ?? '')
        || ['grass', 'forest', 'recreation_ground', 'meadow', 'village_green'].includes(tags.landuse ?? '')
        || tags.natural === 'wood') {
        return 'park';
    }
    if (tags.building !== undefined && tags.building !== 'no') {
        return 'building';
    }
    return null;
};

const same = (a: LonLat | undefined, b: LonLat | undefined): boolean => !!a && !!b && a[0] === b[0] && a[1] === b[1];

export const joinRings = (segments: LonLat[][]): LonLat[][] => {
    const pending = segments.filter((segment) => segment.length > 1).map((segment) => [...segment]);
    const rings: LonLat[][] = [];
    while (pending.length > 0) {
        const ring = pending.shift() as LonLat[];
        let growing = true;
        while (!same(ring[0], ring[ring.length - 1]) && growing) {
            const end = ring[ring.length - 1];
            const index = pending.findIndex((segment) => same(segment[0], end) || same(segment[segment.length - 1], end));
            if (index === -1) {
                growing = false;
                continue;
            }
            const next = pending.splice(index, 1)[0] as LonLat[];
            const oriented = same(next[0], end) ? next : [...next].reverse();
            ring.push(...oriented.slice(1));
        }
        if (same(ring[0], ring[ring.length - 1]) && ring.length >= 4) {
            rings.push(ring);
        }
    }
    return rings;
};

const isClosed = (coords: LonLat[]): boolean => coords.length >= 4 && same(coords[0], coords[coords.length - 1]);

export const parseOverpass = (response: OverpassResponse): OsmData => {
    const lines: NetworkLine[] = [];
    const areas: AreaFeature[] = [];
    const waterways: WaterLine[] = [];
    for (const element of response.elements) {
        const tags = element.tags ?? {};
        if (element.type === 'way') {
            const coords = toCoords(element.geometry);
            if (!coords || !element.nodes) {
                continue;
            }
            const roadClass = osmRoadClass(tags.highway);
            if (roadClass && tags.area !== 'yes') {
                lines.push({
                    id: `w${element.id}`,
                    nodeIds: element.nodes.map(String),
                    coords,
                    roadClass,
                    name: tags.name ?? null,
                    tags,
                });
                continue;
            }
            if (WATERWAY_LINES.has(tags.waterway ?? '')) {
                waterways.push({ kind: 'waterway', coords });
                continue;
            }
            const kind = areaKindOf(tags);
            if (kind && isClosed(coords)) {
                areas.push({ kind, rings: [coords] });
            }
        }
        if (element.type === 'relation' && tags.type === 'multipolygon') {
            const kind = areaKindOf(tags);
            const segments = (element.members ?? [])
                .filter((member) => member.type === 'way')
                .map((member) => toCoords(member.geometry))
                .filter((coords): coords is LonLat[] => coords !== null);
            const rings = joinRings(segments);
            if (kind && rings.length > 0) {
                areas.push({ kind, rings });
            }
        }
    }
    return { network: buildNetwork(lines, ['osm']), extras: { areas, waterways } };
};
