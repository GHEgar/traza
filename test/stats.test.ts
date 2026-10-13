import { describe, expect, it } from 'vitest';
import { buildNetwork } from '../src/core/index.js';
import { networkStats } from '../src/stats/index.js';
import { grid } from './helpers.js';

describe('networkStats', () => {
    it('counts intersections, dead ends and lengths on a grid', () => {
        const stats = networkStats(grid(3));
        expect(stats.nodeCount).toBe(16);
        expect(stats.edgeCount).toBe(24);
        expect(stats.intersections).toBe(12);
        expect(stats.deadEnds).toBe(0);
        expect(stats.meanDegree).toBeCloseTo(3);
        expect(stats.circuity).toBeCloseTo(1, 5);
        expect(stats.lengthByClass.residential / stats.lengthByClass.primary).toBeCloseTo(Math.cos(20.67 * Math.PI / 180), 2);
        expect(stats.totalLength).toBeCloseTo(stats.lengthByClass.primary + stats.lengthByClass.residential);
        expect(stats.density).toBeGreaterThan(0);
        expect(stats.namedShare).toBe(1);
    });

    it('measures circuity of curved edges and uses a given area', () => {
        const network = buildNetwork([
            { id: 'a', nodeIds: ['1', '2', '3'], coords: [[0, 0], [0.0005, 0.0005], [0.001, 0]], roadClass: 'residential', name: null },
        ], ['custom']);
        const stats = networkStats(network, { area: 1e6 });
        expect(stats.circuity).toBeCloseTo(Math.SQRT2, 3);
        expect(stats.deadEnds).toBe(2);
        expect(stats.density).toBeCloseTo(stats.totalLength / 1000);
        expect(stats.namedShare).toBe(0);
    });
});
