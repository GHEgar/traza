import { describe, expect, it, vi } from 'vitest';
import { areasFromGeoJSON, createSnapper, fetchWfs, fromGeoJSON, wfsPageUrl } from '../src/sources/index.js';
import type { GeoJsonCollection, GeoJsonFeature } from '../src/sources/index.js';

const line = (coordinates: number[][], properties: Record<string, unknown>): GeoJsonFeature => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties,
});

describe('createSnapper', () => {
    it('joins points closer than the tolerance', () => {
        const snap = createSnapper(1, 'n');
        const a = snap([-103.35, 20.67]);
        expect(snap([-103.350005, 20.670004])).toBe(a);
        expect(snap([-103.3499, 20.67])).not.toBe(a);
    });
});

describe('fromGeoJSON', () => {
    const collection: GeoJsonCollection = {
        type: 'FeatureCollection',
        features: [
            line([[-103.35, 20.67], [-103.349, 20.67], [-103.348, 20.67]], { NOMVIAL: 'Hidalgo', TIPOVIAL: 'Calle' }),
            line([[-103.349, 20.669], [-103.349000004, 20.670000003], [-103.349, 20.671]], { NOMVIAL: 'Juárez', TIPOVIAL: 'Avenida' }),
            line([[-103.34, 20.66], [-103.339, 20.66]], { NOMVIAL: '', TIPOVIAL: 'Peatonal' }),
        ],
    };

    it('reads names and classes from properties and snaps shared vertices', () => {
        const network = fromGeoJSON(collection, {
            name: (properties) => `${properties.TIPOVIAL} ${properties.NOMVIAL}`,
            roadClass: (properties) => properties.TIPOVIAL === 'Avenida' ? 'primary' : properties.TIPOVIAL === 'Calle' ? 'residential' : null,
        });
        expect(network.sources).toEqual(['custom']);
        expect(network.edges).toHaveLength(4);
        expect(network.edges.find((edge) => edge.roadClass === 'primary')?.name).toBe('Avenida Juárez');
    });

    it('treats empty name fields as unnamed', () => {
        const network = fromGeoJSON(collection, { name: 'NOMVIAL' });
        expect(network.edges.filter((edge) => edge.name === null)).toHaveLength(1);
    });

    it('reads polygons as areas', () => {
        const areas = areasFromGeoJSON({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]], [[[2, 2], [3, 2], [3, 3], [2, 2]]]] } }],
        }, 'park');
        expect(areas).toHaveLength(2);
    });
});

describe('WFS', () => {
    it('asks for lon/lat GeoJSON with paging', () => {
        const url = new URL(wfsPageUrl({ url: 'https://example.test/wfs', typeName: 'ws:calles', bbox: [-104, 20, -103, 21] }, 1000, 500));
        expect(url.searchParams.get('srsName')).toBe('CRS:84');
        expect(url.searchParams.get('startIndex')).toBe('1000');
        expect(url.searchParams.get('count')).toBe('500');
        expect(url.searchParams.get('bbox')).toBe('-104,20,-103,21,CRS:84');
    });

    it('folds the bbox into CQL when there is a filter', () => {
        const url = new URL(wfsPageUrl({ url: 'https://example.test/wfs', typeName: 'ws:calles', bbox: [-104, 20, -103, 21], cqlFilter: "mun = 'GDL'", geometryName: 'geom' }, 0, 10));
        expect(url.searchParams.get('bbox')).toBeNull();
        expect(url.searchParams.get('CQL_FILTER')).toBe("mun = 'GDL' AND BBOX(geom,-104,20,-103,21,'CRS:84')");
    });

    it('pages until a short page', async () => {
        const feature = line([[0, 0], [0.001, 0]], {});
        const pages = [[feature, feature], [feature]];
        const request = vi.fn(async () => new Response(JSON.stringify({ type: 'FeatureCollection', features: pages.shift() ?? [] })));
        const collection = await fetchWfs({ url: 'https://example.test/wfs', typeName: 'ws:calles', pageSize: 2, fetch: request as unknown as typeof fetch });
        expect(collection.features).toHaveLength(3);
        expect(request).toHaveBeenCalledTimes(2);
    });
});
