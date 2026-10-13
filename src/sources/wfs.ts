import type { BBox } from '../core/index.js';
import { fromGeoJSON } from './geojson.js';
import type { GeoJsonCollection, GeoJsonFeature, GeoJsonNetworkOptions } from './geojson.js';
import type { StreetNetwork } from '../core/index.js';

export interface WfsOptions {
    url: string;
    typeName: string;
    bbox?: BBox;
    cqlFilter?: string;
    pageSize?: number;
    maxFeatures?: number;
    srsName?: string;
    geometryName?: string;
    signal?: AbortSignal;
    fetch?: typeof fetch;
}

export class WfsError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'WfsError';
        this.status = status;
    }
}

export const wfsPageUrl = (options: WfsOptions, startIndex: number, count: number): string => {
    const url = new URL(options.url);
    const srsName = options.srsName ?? 'CRS:84';
    const params: Record<string, string> = {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: options.typeName,
        outputFormat: 'application/json',
        srsName,
        count: String(count),
        startIndex: String(startIndex),
    };
    if (options.cqlFilter) {
        const bboxFilter = options.bbox ? ` AND BBOX(${options.geometryName ?? 'the_geom'},${options.bbox.join(',')},'${srsName}')` : '';
        params.CQL_FILTER = `${options.cqlFilter}${bboxFilter}`;
    } else if (options.bbox) {
        params.bbox = `${options.bbox.join(',')},${srsName}`;
    }
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
};

export const fetchWfs = async (options: WfsOptions): Promise<GeoJsonCollection> => {
    const request = options.fetch ?? globalThis.fetch;
    const pageSize = options.pageSize ?? 1000;
    const limit = options.maxFeatures ?? Infinity;
    const features: GeoJsonFeature[] = [];
    let done = false;
    while (!done) {
        const count = Math.min(pageSize, limit - features.length);
        const init: RequestInit = options.signal ? { signal: options.signal } : {};
        const response = await request(wfsPageUrl(options, features.length, count), init);
        if (!response.ok) {
            throw new WfsError(`WFS answered ${response.status}`, response.status);
        }
        const page = await response.json() as GeoJsonCollection;
        features.push(...page.features);
        done = page.features.length < count || features.length >= limit;
    }
    return { type: 'FeatureCollection', features };
};

export const loadWfsNetwork = async (options: WfsOptions & GeoJsonNetworkOptions): Promise<StreetNetwork> =>
    fromGeoJSON(await fetchWfs(options), options);
