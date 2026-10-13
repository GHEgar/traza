import { describe, expect, it } from 'vitest';
import { buildNetwork } from '../src/core/index.js';
import type { LonLat, NetworkLine } from '../src/core/index.js';
import { binIndex, entropyOf, orientation } from '../src/orientation/index.js';
import { grid } from './helpers.js';

describe('orientation', () => {
    it('centers the first bin on north', () => {
        expect(binIndex(0, 36)).toBe(0);
        expect(binIndex(4.9, 36)).toBe(0);
        expect(binIndex(355.1, 36)).toBe(0);
        expect(binIndex(5.1, 36)).toBe(1);
        expect(binIndex(90, 36)).toBe(9);
    });

    it('gives a perfect grid an order of one', () => {
        const result = orientation(grid(5));
        expect(result.entropy).toBeCloseTo(Math.log(4), 2);
        expect(result.order).toBeCloseTo(1, 2);
        expect(result.bins.filter((bin) => bin.share > 0)).toHaveLength(4);
    });

    it('is symmetric', () => {
        const result = orientation(grid(3));
        result.bins.forEach((bin, index) => {
            expect(bin.value).toBeCloseTo(result.bins[(index + 18) % 36]?.value ?? -1, 6);
        });
    });

    it('gives an evenly spread network an order near zero', () => {
        const lines: NetworkLine[] = [];
        for (let i = 0; i < 36; i++) {
            const angle = i * 10 * Math.PI / 180;
            const end: LonLat = [0.01 * Math.sin(angle), 0.01 * Math.cos(angle)];
            lines.push({ id: `s${i}`, nodeIds: ['c', `e${i}`], coords: [[0, 0], end], roadClass: 'residential', name: null });
        }
        const result = orientation(buildNetwork(lines, ['custom']));
        expect(result.entropy).toBeCloseTo(Math.log(36), 1);
        expect(result.order).toBeLessThan(0.05);
    });

    it('filters by class', () => {
        const result = orientation(grid(3), { classes: ['primary'] });
        expect(result.bins.filter((bin) => bin.share > 0).map((bin) => bin.center)).toEqual([0, 180]);
    });

    it('computes Shannon entropy', () => {
        expect(entropyOf([1, 1, 1, 1])).toBeCloseTo(Math.log(4));
        expect(entropyOf([0, 0])).toBe(0);
    });
});
