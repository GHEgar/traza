import { describe, expect, it } from 'vitest';
import {
    bboxAround,
    bearing,
    buildNetwork,
    createProjection,
    distance,
    filterNetwork,
    nodeDegrees,
    osmRoadClass,
} from '../src/core/index.js';
import { grid } from './helpers.js';

describe('geo', () => {
    it('measures a degree of latitude', () => {
        expect(distance([0, 0], [0, 1])).toBeCloseTo(111_195, -1);
    });

    it('gives compass bearings', () => {
        expect(bearing([0, 0], [0, 1])).toBeCloseTo(0);
        expect(bearing([0, 0], [1, 0])).toBeCloseTo(90);
        expect(bearing([0, 0], [0, -1])).toBeCloseTo(180);
        expect(bearing([0, 0], [-1, 0])).toBeCloseTo(270);
    });

    it('builds a bbox around a point', () => {
        const [west, south, east, north] = bboxAround([-103.35, 20.67], 1000);
        expect(distance([-103.35, south], [-103.35, north])).toBeCloseTo(2000, -1);
        expect(east).toBeGreaterThan(west);
    });
});

describe('projection', () => {
    it('keeps distances from the center', () => {
        const projection = createProjection([-103.35, 20.67]);
        const [x, y] = projection.forward([-103.34, 20.68]);
        expect(Math.hypot(x, y)).toBeCloseTo(distance([-103.35, 20.67], [-103.34, 20.68]), 3);
        expect(projection.forward([-103.35, 20.67])).toEqual([0, 0]);
    });
});

describe('network', () => {
    it('maps OSM highways to six classes', () => {
        expect(osmRoadClass('trunk_link')).toBe('motorway');
        expect(osmRoadClass('living_street')).toBe('residential');
        expect(osmRoadClass('steps')).toBe('path');
        expect(osmRoadClass('construction')).toBeNull();
        expect(osmRoadClass(undefined)).toBeNull();
    });

    it('splits lines at shared nodes', () => {
        const network = buildNetwork([
            { id: 'a', nodeIds: ['1', '2', '3'], coords: [[0, 0], [0.001, 0], [0.002, 0]], roadClass: 'residential', name: 'A' },
            { id: 'b', nodeIds: ['4', '2', '5'], coords: [[0.001, -0.001], [0.001, 0], [0.001, 0.001]], roadClass: 'primary', name: 'B' },
        ], ['custom']);
        expect(network.edges).toHaveLength(4);
        expect(nodeDegrees(network).get('2')).toBe(4);
    });

    it('keeps internal vertices that are not shared', () => {
        const network = buildNetwork([
            { id: 'a', nodeIds: ['1', '2', '3'], coords: [[0, 0], [0.001, 0.0005], [0.002, 0]], roadClass: 'residential', name: null },
        ], ['custom']);
        expect(network.edges).toHaveLength(1);
        expect(network.edges[0]?.coords).toHaveLength(3);
    });

    it('builds a grid with one edge per block side', () => {
        const network = grid(3);
        expect(network.nodes.size).toBe(16);
        expect(network.edges).toHaveLength(24);
    });

    it('filters edges and their nodes', () => {
        const network = filterNetwork(grid(2), (edge) => edge.roadClass === 'primary');
        expect(network.edges.every((edge) => edge.roadClass === 'primary')).toBe(true);
        expect(network.nodes.size).toBe(9);
    });
});
