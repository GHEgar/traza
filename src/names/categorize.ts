import type { StreetNetwork } from '../core/index.js';
import { fold, parseStreetName } from './normalize.js';
import type { ParsedName, ParseOptions } from './normalize.js';

export interface NameRule {
    id: string;
    match: string[] | RegExp | ((name: ParsedName) => boolean);
}

export type Categorizer = (raw: string | null) => string | null;

export interface CategorySummary {
    id: string;
    length: number;
    edges: number;
    names: number;
}

export interface NetworkCategories {
    byEdge: Map<string, string | null>;
    categories: CategorySummary[];
    uncategorized: number;
    unnamed: number;
}

export const createCategorizer = (rules: NameRule[], options: ParseOptions = {}): Categorizer => {
    const tests = rules.map((rule) => {
        const { match } = rule;
        if (Array.isArray(match)) {
            const entries = match.map((entry) => ` ${parseStreetName(entry, options).key || fold(entry)} `);
            return (name: ParsedName) => entries.some((entry) => ` ${name.key} `.includes(entry));
        }
        if (match instanceof RegExp) {
            return (name: ParsedName) => {
                match.lastIndex = 0;
                const onKey = match.test(name.key);
                match.lastIndex = 0;
                return onKey || match.test(name.raw);
            };
        }
        return match;
    });
    return (raw) => {
        if (raw === null || raw.trim() === '') {
            return null;
        }
        const parsed = parseStreetName(raw, options);
        const index = tests.findIndex((test) => test(parsed));
        return index === -1 ? null : (rules[index] as NameRule).id;
    };
};

export const categorizeNetwork = (network: StreetNetwork, rules: NameRule[], options: ParseOptions = {}): NetworkCategories => {
    const categorize = createCategorizer(rules, options);
    const byEdge = new Map<string, string | null>();
    const totals = new Map<string, { length: number; edges: number; names: Set<string> }>(
        rules.map((rule) => [rule.id, { length: 0, edges: 0, names: new Set<string>() }]),
    );
    let uncategorized = 0;
    let unnamed = 0;
    for (const edge of network.edges) {
        const category = categorize(edge.name);
        byEdge.set(edge.id, category);
        if (edge.name === null) {
            unnamed += edge.length;
            continue;
        }
        const total = category === null ? undefined : totals.get(category);
        if (!total) {
            uncategorized += edge.length;
            continue;
        }
        total.length += edge.length;
        total.edges += 1;
        total.names.add(parseStreetName(edge.name, options).key);
    }
    return {
        byEdge,
        categories: [...totals].map(([id, total]) => ({ id, length: total.length, edges: total.edges, names: total.names.size })),
        uncategorized,
        unnamed,
    };
};
