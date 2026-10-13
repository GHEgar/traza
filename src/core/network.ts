import { bboxOf, lineLength } from './geo.js';
import type { BBox, DataSource, LonLat, RoadClass, StreetEdge, StreetNetwork, StreetNode } from './types.js';

export interface NetworkLine {
    id: string;
    nodeIds: string[];
    coords: LonLat[];
    roadClass: RoadClass;
    name: string | null;
    tags?: Record<string, string>;
}

const countUses = (lines: NetworkLine[]): Map<string, number> => {
    const uses = new Map<string, number>();
    for (const line of lines) {
        line.nodeIds.forEach((id, index) => {
            const isEnd = index === 0 || index === line.nodeIds.length - 1;
            uses.set(id, (uses.get(id) ?? 0) + (isEnd ? 2 : 1));
        });
    }
    return uses;
};

export const buildNetwork = (lines: NetworkLine[], sources: DataSource[]): StreetNetwork => {
    const uses = countUses(lines);
    const nodes = new Map<string, StreetNode>();
    const edges: StreetEdge[] = [];
    for (const line of lines) {
        if (line.nodeIds.length !== line.coords.length || line.coords.length < 2) {
            continue;
        }
        let start = 0;
        let part = 0;
        for (let i = 1; i < line.nodeIds.length; i++) {
            const isLast = i === line.nodeIds.length - 1;
            if (!isLast && (uses.get(line.nodeIds[i] as string) ?? 0) < 2) {
                continue;
            }
            const coords = line.coords.slice(start, i + 1);
            const length = lineLength(coords);
            if (length > 0) {
                const from = line.nodeIds[start] as string;
                const to = line.nodeIds[i] as string;
                nodes.set(from, { id: from, coord: coords[0] as LonLat });
                nodes.set(to, { id: to, coord: coords[coords.length - 1] as LonLat });
                edges.push({
                    id: `${line.id}:${part}`,
                    from,
                    to,
                    coords,
                    length,
                    roadClass: line.roadClass,
                    name: line.name,
                    tags: line.tags ?? {},
                });
                part++;
            }
            start = i;
        }
    }
    return { nodes, edges, sources: [...new Set(sources)] };
};

export const filterNetwork = (network: StreetNetwork, keep: (edge: StreetEdge) => boolean): StreetNetwork => {
    const edges = network.edges.filter(keep);
    const nodes = new Map<string, StreetNode>();
    for (const edge of edges) {
        const from = network.nodes.get(edge.from);
        const to = network.nodes.get(edge.to);
        if (from) {
            nodes.set(from.id, from);
        }
        if (to) {
            nodes.set(to.id, to);
        }
    }
    return { nodes, edges, sources: network.sources };
};

export const mergeNetworks = (...networks: StreetNetwork[]): StreetNetwork => {
    const nodes = new Map<string, StreetNode>();
    const edges: StreetEdge[] = [];
    const sources: DataSource[] = [];
    for (const network of networks) {
        network.nodes.forEach((node, id) => nodes.set(id, node));
        edges.push(...network.edges);
        sources.push(...network.sources);
    }
    return { nodes, edges, sources: [...new Set(sources)] };
};

export const nodeDegrees = (network: StreetNetwork): Map<string, number> => {
    const degrees = new Map<string, number>();
    for (const id of network.nodes.keys()) {
        degrees.set(id, 0);
    }
    for (const edge of network.edges) {
        degrees.set(edge.from, (degrees.get(edge.from) ?? 0) + 1);
        degrees.set(edge.to, (degrees.get(edge.to) ?? 0) + 1);
    }
    return degrees;
};

export const networkBBox = (network: StreetNetwork): BBox => {
    const coords = function* (): Generator<LonLat> {
        for (const edge of network.edges) {
            yield* edge.coords;
        }
    };
    return bboxOf(coords());
};

export const needsOsmAttribution = (network: StreetNetwork): boolean => network.sources.includes('osm');

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
