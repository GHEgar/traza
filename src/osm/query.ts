import { bboxArea, ringArea } from '../core/index.js';
import type { BBox, LonLat } from '../core/index.js';

export type OverpassArea = { bbox: BBox } | { polygon: LonLat[] };

export interface QueryLayers {
    streets?: boolean;
    water?: boolean;
    parks?: boolean;
    buildings?: boolean;
}

export interface QueryOptions extends QueryLayers {
    timeout?: number;
}

const filterOf = (area: OverpassArea): string => {
    if ('bbox' in area) {
        const [west, south, east, north] = area.bbox;
        return `(${south},${west},${north},${east})`;
    }
    const points = area.polygon.map(([lon, lat]) => `${lat} ${lon}`).join(' ');
    return `(poly:"${points}")`;
};

export const areaSize = (area: OverpassArea): number => 'bbox' in area ? bboxArea(area.bbox) : ringArea(area.polygon);

export const buildOverpassQuery = (area: OverpassArea, options: QueryOptions = {}): string => {
    const { streets = true, water = false, parks = false, buildings = false, timeout = 60 } = options;
    const f = filterOf(area);
    const parts: string[] = [];
    if (streets) {
        parts.push(`way["highway"]${f};`);
    }
    if (water) {
        parts.push(
            `way["natural"="water"]${f};`,
            `relation["natural"="water"]${f};`,
            `way["waterway"~"^(river|canal|stream|riverbank)$"]${f};`,
            `way["landuse"~"^(reservoir|basin)$"]${f};`,
        );
    }
    if (parks) {
        parts.push(
            `way["leisure"~"^(park|garden|nature_reserve)$"]${f};`,
            `relation["leisure"~"^(park|garden|nature_reserve)$"]${f};`,
            `way["landuse"~"^(grass|forest|recreation_ground|meadow|village_green)$"]${f};`,
            `way["natural"="wood"]${f};`,
        );
    }
    if (buildings) {
        parts.push(`way["building"]${f};`);
    }
    return `[out:json][timeout:${timeout}];\n(\n${parts.map((part) => `  ${part}`).join('\n')}\n);\nout geom;`;
};
