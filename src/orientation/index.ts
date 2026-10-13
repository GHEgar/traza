import { bearing, distance } from '../core/index.js';
import type { LonLat, RoadClass, StreetEdge, StreetNetwork } from '../core/index.js';

export interface OrientationOptions {
    bins?: number;
    weight?: 'length' | 'count';
    classes?: RoadClass[];
}

export interface OrientationBin {
    index: number;
    start: number;
    end: number;
    center: number;
    value: number;
    share: number;
}

export interface OrientationResult {
    bins: OrientationBin[];
    binWidth: number;
    total: number;
    entropy: number;
    maxEntropy: number;
    order: number;
}

export const GRID_ENTROPY = Math.log(4);

export const binIndex = (degrees: number, bins: number): number => {
    const width = 360 / bins;
    return Math.floor((((degrees + width / 2) % 360) + 360) % 360 / width) % bins;
};

export const entropyOf = (values: number[]): number => {
    const total = values.reduce((sum, value) => sum + value, 0);
    if (total === 0) {
        return 0;
    }
    return values.reduce((sum, value) => {
        const p = value / total;
        return p > 0 ? sum - p * Math.log(p) : sum;
    }, 0);
};

export const orientationOrder = (entropy: number, bins: number): number => {
    const max = Math.log(bins);
    if (max <= GRID_ENTROPY) {
        return 0;
    }
    const order = 1 - ((entropy - GRID_ENTROPY) / (max - GRID_ENTROPY)) ** 2;
    return Math.max(0, Math.min(1, order));
};

export const edgeBearing = (edge: StreetEdge): number =>
    bearing(edge.coords[0] as LonLat, edge.coords[edge.coords.length - 1] as LonLat) % 180;

export const orientation = (network: StreetNetwork, options: OrientationOptions = {}): OrientationResult => {
    const bins = options.bins ?? 36;
    const width = 360 / bins;
    const values = new Array<number>(bins).fill(0);
    const classes = options.classes ? new Set(options.classes) : null;
    for (const edge of network.edges) {
        if (classes && !classes.has(edge.roadClass)) {
            continue;
        }
        for (let i = 1; i < edge.coords.length; i++) {
            const a = edge.coords[i - 1] as LonLat;
            const b = edge.coords[i] as LonLat;
            const length = distance(a, b);
            if (length === 0) {
                continue;
            }
            const weight = options.weight === 'count' ? 1 : length;
            const forward = bearing(a, b);
            for (const degrees of [forward, forward + 180]) {
                const index = binIndex(degrees, bins);
                values[index] = (values[index] ?? 0) + weight;
            }
        }
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    const entropy = entropyOf(values);
    return {
        bins: values.map((value, index) => ({
            index,
            start: (index * width - width / 2 + 360) % 360,
            end: index * width + width / 2,
            center: index * width,
            value,
            share: total > 0 ? value / total : 0,
        })),
        binWidth: width,
        total,
        entropy,
        maxEntropy: Math.log(bins),
        order: orientationOrder(entropy, bins),
    };
};
