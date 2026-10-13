import { describe, expect, it, vi } from 'vitest';
import {
    AreaTooLargeError,
    buildOverpassQuery,
    joinRings,
    loadOsm,
    OverpassError,
    parseOverpass,
} from '../src/osm/index.js';
import type { OverpassResponse } from '../src/osm/index.js';
import data from './fixtures/overpass.json';

const fixture = data as OverpassResponse;

const respond = (body: unknown, status = 200): typeof fetch =>
    vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('buildOverpassQuery', () => {
    it('uses south, west, north, east for a bbox', () => {
        const query = buildOverpassQuery({ bbox: [-103.36, 20.66, -103.34, 20.68] });
        expect(query).toContain('way["highway"](20.66,-103.36,20.68,-103.34);');
        expect(query).toContain('out geom;');
        expect(query).not.toContain('building');
    });

    it('uses lat lon pairs for a polygon and adds layers', () => {
        const query = buildOverpassQuery({ polygon: [[-103.36, 20.66], [-103.34, 20.66], [-103.35, 20.68]] }, { water: true, parks: true, buildings: true });
        expect(query).toContain('(poly:"20.66 -103.36 20.66 -103.34 20.68 -103.35")');
        expect(query).toContain('way["building"]');
        expect(query).toContain('relation["natural"="water"]');
    });
});

describe('parseOverpass', () => {
    const { network, extras } = parseOverpass(fixture);

    it('builds the street network and drops unknown highways', () => {
        expect(network.sources).toEqual(['osm']);
        expect(network.edges).toHaveLength(4);
        expect(network.edges.map((edge) => edge.name)).toContain('Av. Juárez');
        expect(network.edges.some((edge) => edge.id.startsWith('w3'))).toBe(false);
    });

    it('reads parks, waterways and multipolygon water', () => {
        expect(extras.areas.map((area) => area.kind).sort()).toEqual(['park', 'water']);
        expect(extras.waterways).toHaveLength(1);
        const water = extras.areas.find((area) => area.kind === 'water');
        expect(water?.rings).toHaveLength(1);
        expect(water?.rings[0]).toHaveLength(5);
    });
});

describe('joinRings', () => {
    it('drops rings that cannot close', () => {
        expect(joinRings([[[0, 0], [1, 0]], [[1, 0], [1, 1]]])).toEqual([]);
    });
});

describe('loadOsm', () => {
    it('refuses areas above the limit without calling the network', async () => {
        const request = respond(fixture);
        await expect(loadOsm({ bbox: [-104, 20, -103, 21] }, { fetch: request })).rejects.toBeInstanceOf(AreaTooLargeError);
        expect(request).not.toHaveBeenCalled();
    });

    it('posts the query and parses the answer', async () => {
        const request = respond(fixture);
        const data = await loadOsm({ bbox: [-103.351, 20.659, -103.347, 20.673] }, { fetch: request, endpoint: 'https://example.test/api', userAgent: 'traza-test/1' });
        expect(data.network.edges).toHaveLength(4);
        const [url, init] = (request as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
        expect(url).toBe('https://example.test/api');
        expect(String(init.body)).toContain('data=');
        expect(init.headers).toMatchObject({ 'User-Agent': 'traza-test/1' });
    });

    it('raises on an error status', async () => {
        await expect(loadOsm({ bbox: [-103.351, 20.659, -103.347, 20.673] }, { fetch: respond({}, 429) }))
            .rejects.toBeInstanceOf(OverpassError);
    });
});
