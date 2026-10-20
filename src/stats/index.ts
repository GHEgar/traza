import { bboxArea, distance, networkBBox, nodeDegrees, ROAD_CLASSES } from '../core/index.js';
import type { RoadClass, StreetNetwork } from '../core/index.js';

export interface StatsOptions {
    area?: number;
}

export interface NetworkStats {
    nodeCount: number;
    edgeCount: number;
    totalLength: number;
    lengthByClass: Record<RoadClass, number>;
    intersections: number;
    deadEnds: number;
    meanDegree: number;
    meanEdgeLength: number;
    circuity: number;
    area: number;
    areaKm2: number;
    density: number;
    lengthDensityKmPerKm2: number;
    intersectionDensity: number;
    intersectionsPerKm2: number;
    namedShare: number;
}

export const networkStats = (network: StreetNetwork, options: StatsOptions = {}): NetworkStats => {
    const degrees = nodeDegrees(network);
    const lengthByClass = Object.fromEntries(ROAD_CLASSES.map((roadClass) => [roadClass, 0])) as Record<RoadClass, number>;
    let totalLength = 0;
    let namedLength = 0;
    let curved = 0;
    let straight = 0;
    for (const edge of network.edges) {
        totalLength += edge.length;
        lengthByClass[edge.roadClass] += edge.length;
        if (edge.name !== null) {
            namedLength += edge.length;
        }
        const from = network.nodes.get(edge.from);
        const to = network.nodes.get(edge.to);
        if (from && to && edge.from !== edge.to) {
            const direct = distance(from.coord, to.coord);
            if (direct > 0) {
                curved += edge.length;
                straight += direct;
            }
        }
    }
    let intersections = 0;
    let deadEnds = 0;
    let degreeSum = 0;
    for (const degree of degrees.values()) {
        degreeSum += degree;
        if (degree >= 3) {
            intersections++;
        }
        if (degree === 1) {
            deadEnds++;
        }
    }
    const area = options.area ?? (network.edges.length > 0 ? bboxArea(networkBBox(network)) : 0);
    const areaKm2 = area / 1e6;
    const lengthDensityKmPerKm2 = areaKm2 > 0 ? totalLength / 1000 / areaKm2 : 0;
    const intersectionsPerKm2 = areaKm2 > 0 ? intersections / areaKm2 : 0;
    return {
        nodeCount: network.nodes.size,
        edgeCount: network.edges.length,
        totalLength,
        lengthByClass,
        intersections,
        deadEnds,
        meanDegree: degrees.size > 0 ? degreeSum / degrees.size : 0,
        meanEdgeLength: network.edges.length > 0 ? totalLength / network.edges.length : 0,
        circuity: straight > 0 ? curved / straight : 1,
        area,
        areaKm2,
        density: lengthDensityKmPerKm2,
        lengthDensityKmPerKm2,
        intersectionDensity: intersectionsPerKm2,
        intersectionsPerKm2,
        namedShare: totalLength > 0 ? namedLength / totalLength : 0,
    };
};
