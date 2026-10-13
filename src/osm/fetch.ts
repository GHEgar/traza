import { areaSize, buildOverpassQuery } from './query.js';
import type { OverpassArea, QueryOptions } from './query.js';
import { parseOverpass } from './parse.js';
import type { OsmData, OverpassResponse } from './parse.js';

export const DEFAULT_OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export const DEFAULT_MAX_AREA = 25_000_000;

export interface FetchOptions {
    endpoint?: string;
    signal?: AbortSignal;
    fetch?: typeof fetch;
    userAgent?: string;
}

export interface LoadOsmOptions extends FetchOptions, QueryOptions {
    maxArea?: number;
}

export class OverpassError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'OverpassError';
        this.status = status;
    }
}

export class AreaTooLargeError extends Error {
    readonly area: number;
    readonly maxArea: number;

    constructor(area: number, maxArea: number) {
        super(`Area of ${Math.round(area / 1e6)} km² exceeds the limit of ${Math.round(maxArea / 1e6)} km²`);
        this.name = 'AreaTooLargeError';
        this.area = area;
        this.maxArea = maxArea;
    }
}

export const fetchOverpass = async (query: string, options: FetchOptions = {}): Promise<OverpassResponse> => {
    const request = options.fetch ?? globalThis.fetch;
    const init: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...(options.userAgent ? { 'User-Agent': options.userAgent } : {}),
        },
        body: new URLSearchParams({ data: query }).toString(),
    };
    if (options.signal) {
        init.signal = options.signal;
    }
    const response = await request(options.endpoint ?? DEFAULT_OVERPASS_ENDPOINT, init);
    if (!response.ok) {
        throw new OverpassError(`Overpass answered ${response.status}`, response.status);
    }
    return await response.json() as OverpassResponse;
};

export const loadOsm = async (area: OverpassArea, options: LoadOsmOptions = {}): Promise<OsmData> => {
    const maxArea = options.maxArea ?? DEFAULT_MAX_AREA;
    const size = areaSize(area);
    if (size > maxArea) {
        throw new AreaTooLargeError(size, maxArea);
    }
    const response = await fetchOverpass(buildOverpassQuery(area, options), options);
    return parseOverpass(response);
};
