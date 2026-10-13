import { buildNetwork } from '../src/core/index.js';
import type { LonLat, NetworkLine, StreetNetwork } from '../src/core/index.js';

export const STEP = 0.001;

export const grid = (size: number, origin: LonLat = [-103.35, 20.67]): StreetNetwork => {
    const lines: NetworkLine[] = [];
    const id = (i: number, j: number): string => `${i}-${j}`;
    for (let i = 0; i <= size; i++) {
        const row: LonLat[] = [];
        const col: LonLat[] = [];
        const rowIds: string[] = [];
        const colIds: string[] = [];
        for (let j = 0; j <= size; j++) {
            row.push([origin[0] + j * STEP, origin[1] + i * STEP]);
            rowIds.push(id(i, j));
            col.push([origin[0] + i * STEP, origin[1] + j * STEP]);
            colIds.push(id(j, i));
        }
        lines.push({ id: `r${i}`, nodeIds: rowIds, coords: row, roadClass: 'residential', name: `Calle ${i}` });
        lines.push({ id: `c${i}`, nodeIds: colIds, coords: col, roadClass: 'primary', name: `Av. Colón ${i}` });
    }
    return buildNetwork(lines, ['osm']);
};
