import type { NetworkCategories, NameCount, TypeCount } from 'traza/names';
import type { NetworkStats } from 'traza/stats';
import { CATEGORY_LABELS } from './rules.js';

const km = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const nameCount = (count: number): string => `${int.format(count)} ${count === 1 ? 'name' : 'names'}`;

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
};

export const renderStats = (target: HTMLElement, stats: NetworkStats, types: TypeCount[]): void => {
    const rows: [string, string][] = [
        ['Total length', `${km.format(stats.totalLength / 1000)} km`],
        ['Segments', int.format(stats.edgeCount)],
        ['Intersections', int.format(stats.intersections)],
        ['Dead ends', int.format(stats.deadEnds)],
        ['Mean degree', dec.format(stats.meanDegree)],
        ['Mean segment', `${int.format(stats.meanEdgeLength)} m`],
        ['Circuity', dec.format(stats.circuity)],
        ['Density', `${km.format(stats.lengthDensityKmPerKm2)} km/km²`],
        ['Intersections/km²', int.format(stats.intersectionsPerKm2)],
        ['Named', pct.format(stats.namedShare)],
        ...types.slice(0, 4).map((type): [string, string] => [type.type ?? 'Untyped', `${km.format(type.length / 1000)} km · ${nameCount(type.names)}`]),
    ];
    target.replaceChildren(...rows.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
};

export const renderNames = (
    legend: HTMLElement,
    list: HTMLElement,
    categories: NetworkCategories,
    names: NameCount[],
    colors: Record<string, string>,
): void => {
    const named = categories.categories.reduce((sum, entry) => sum + entry.length, categories.uncategorized);
    legend.replaceChildren(...categories.categories.map((entry) => {
        const item = element('li', `${CATEGORY_LABELS[entry.id] ?? entry.id} · ${pct.format(named > 0 ? entry.length / named : 0)} · ${nameCount(entry.names)}`);
        item.style.setProperty('--swatch', colors[entry.id] ?? 'transparent');
        return item;
    }));
    list.replaceChildren(...names.map((entry) => element('li', `${entry.name} · ${km.format(entry.length / 1000)} km`)));
};
