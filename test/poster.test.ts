import { describe, expect, it } from 'vitest';
import { createPosterScene, formatCoordinates } from '../src/poster/index.js';
import { posterToSvg, roseToSvg } from '../src/svg/index.js';
import type { PosterTheme } from '../src/svg/index.js';
import { orientation } from '../src/orientation/index.js';
import { buildNetwork } from '../src/core/index.js';
import { grid } from './helpers.js';

const theme: PosterTheme = {
    background: '#f4efe6',
    layers: { primary: { stroke: '#222', width: 1.5 }, residential: { stroke: '#555', width: 0.6 } },
    text: { title: { fill: '#222', fontSize: 20, uppercase: true } },
    frame: { stroke: '#222', width: 1 },
};

describe('formatCoordinates', () => {
    it('writes hemispheres', () => {
        expect(formatCoordinates([-103.3475, 20.6767])).toBe('20.6767° N · 103.3475° W');
        expect(formatCoordinates([2.35, -1.5], { decimals: 1, labels: { north: 'N', south: 'S', east: 'E', west: 'O' } })).toBe('1.5° S · 2.4° E');
    });
});

describe('createPosterScene', () => {
    const scene = createPosterScene({ network: grid(4), title: 'Guadalajara', subtitle: 'Centro', shape: 'circle' });

    it('fits the map above the text block', () => {
        expect(scene.frame.cy + scene.frame.r).toBeLessThanOrEqual(scene.height - 24 - 64 + 1e-6);
        expect(scene.layers.map((layer) => layer.id)).toEqual(['residential', 'primary']);
    });

    it('always carries the OSM attribution', () => {
        expect(scene.attribution).toBe('© OpenStreetMap contributors');
        expect(scene.texts.map((text) => text.role)).toEqual(['title', 'subtitle', 'coordinates', 'attribution']);
        const extra = createPosterScene({ network: grid(2), attribution: 'Diseño: Edgar' });
        expect(extra.attribution).toBe('© OpenStreetMap contributors · Diseño: Edgar');
    });

    it('omits attribution for custom data unless given', () => {
        const network = buildNetwork([
            { id: 'a', nodeIds: ['1', '2'], coords: [[0, 0], [0.001, 0]], roadClass: 'residential', name: null },
        ], ['custom']);
        expect(createPosterScene({ network, coordinates: false }).texts).toEqual([]);
    });

    it('drops paths outside the frame', () => {
        const small = createPosterScene({ network: grid(10), center: [-103.35, 20.67], radius: 60 });
        const total = small.layers.reduce((sum, layer) => sum + layer.paths.length, 0);
        expect(total).toBeLessThan(grid(10).edges.length);
        expect(total).toBeGreaterThan(0);
    });

    it('groups lines with a custom key', () => {
        const byName = createPosterScene({ network: grid(2), edgeKey: (edge) => edge.name?.startsWith('Av') ? 'avenue' : 'other' });
        expect(byName.layers.map((layer) => layer.id).sort()).toEqual(['avenue', 'other']);
    });
});

describe('posterToSvg', () => {
    it('draws only themed layers, clips and escapes text', () => {
        const scene = createPosterScene({ network: grid(3), title: 'Tlaquepaque & <Centro>' });
        const svg = posterToSvg(scene, theme);
        expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
        expect(svg).toContain('clip-path="url(#traza-clip)"');
        expect(svg).toContain('data-layer="primary"');
        expect(svg).toContain('TLAQUEPAQUE &amp; &lt;CENTRO&gt;');
        expect(svg).toContain('© OpenStreetMap contributors');
        expect(svg).not.toContain('N · ');
    });

    it('draws the attribution even without a theme style for it', () => {
        const svg = posterToSvg(createPosterScene({ network: grid(2) }), { background: '#fff', layers: {}, text: {} });
        expect(svg).toContain('© OpenStreetMap contributors');
    });
});

describe('roseToSvg', () => {
    it('draws one wedge per non-empty bin', () => {
        const svg = roseToSvg(orientation(grid(3)), { fill: '#333', labels: { fill: '#333', fontSize: 10 } });
        expect(svg.match(/A/g)?.length).toBe(4);
        expect(svg).toContain('>N<');
        expect(svg).toContain('>W<');
    });
});
