import type { RoadClass, StreetEdge, StreetNetwork } from '../core/index.js';
import { parseStreetName } from './normalize.js';
import type { ParseOptions } from './normalize.js';

export interface NameCount {
    key: string;
    name: string;
    length: number;
    edges: number;
}

export interface TypeCount {
    type: string | null;
    length: number;
    names: number;
}

export interface ClassFilter {
    classes?: RoadClass[];
}

export interface RankingOptions extends ParseOptions, ClassFilter {
    limit?: number;
    by?: 'length' | 'edges';
}

const namedEdges = (network: StreetNetwork, options: ClassFilter): (StreetEdge & { name: string })[] => {
    const classes = options.classes ? new Set(options.classes) : null;
    return network.edges.filter((edge): edge is StreetEdge & { name: string } =>
        edge.name !== null && (!classes || classes.has(edge.roadClass)));
};

export const topStreetNames = (network: StreetNetwork, options: RankingOptions = {}): NameCount[] => {
    const groups = new Map<string, { length: number; edges: number; spellings: Map<string, number> }>();
    for (const edge of namedEdges(network, options)) {
        const parsed = parseStreetName(edge.name, options);
        const group = groups.get(parsed.key) ?? { length: 0, edges: 0, spellings: new Map<string, number>() };
        group.length += edge.length;
        group.edges += 1;
        group.spellings.set(parsed.base, (group.spellings.get(parsed.base) ?? 0) + edge.length);
        groups.set(parsed.key, group);
    }
    const by = options.by ?? 'length';
    return [...groups]
        .map(([key, group]) => ({
            key,
            name: [...group.spellings].sort((a, b) => b[1] - a[1])[0]?.[0] ?? key,
            length: group.length,
            edges: group.edges,
        }))
        .sort((a, b) => b[by] - a[by] || a.key.localeCompare(b.key))
        .slice(0, options.limit ?? 10);
};

export const streetTypes = (network: StreetNetwork, options: ParseOptions & ClassFilter = {}): TypeCount[] => {
    const groups = new Map<string | null, { length: number; names: Set<string> }>();
    for (const edge of namedEdges(network, options)) {
        const parsed = parseStreetName(edge.name, options);
        const group = groups.get(parsed.type) ?? { length: 0, names: new Set<string>() };
        group.length += edge.length;
        group.names.add(parsed.key);
        groups.set(parsed.type, group);
    }
    return [...groups]
        .map(([type, group]) => ({ type, length: group.length, names: group.names.size }))
        .sort((a, b) => b.length - a.length);
};
