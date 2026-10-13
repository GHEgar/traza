import type { NetworkCategories, NameCount, TypeCount } from 'traza/names';
import type { NetworkStats } from 'traza/stats';
import { CATEGORY_LABELS } from './rules.js';

const km = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
const int = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 });

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
};

export const renderStats = (target: HTMLElement, stats: NetworkStats, types: TypeCount[]): void => {
    const rows: [string, string][] = [
        ['Longitud total', `${km.format(stats.totalLength / 1000)} km`],
        ['Tramos', int.format(stats.edgeCount)],
        ['Intersecciones', int.format(stats.intersections)],
        ['Calles sin salida', int.format(stats.deadEnds)],
        ['Grado medio', dec.format(stats.meanDegree)],
        ['Tramo medio', `${int.format(stats.meanEdgeLength)} m`],
        ['Circuidad', dec.format(stats.circuity)],
        ['Densidad', `${km.format(stats.density)} km/km²`],
        ['Intersecciones/km²', int.format(stats.intersectionDensity)],
        ['Con nombre', pct.format(stats.namedShare)],
        ...types.slice(0, 4).map((type): [string, string] => [type.type ?? 'Sin tipo', `${km.format(type.length / 1000)} km · ${type.names} nombres`]),
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
        const item = element('li', `${CATEGORY_LABELS[entry.id] ?? entry.id} · ${pct.format(named > 0 ? entry.length / named : 0)} · ${entry.names} nombres`);
        item.style.setProperty('--swatch', colors[entry.id] ?? 'transparent');
        return item;
    }));
    list.replaceChildren(...names.map((entry) => element('li', `${entry.name} · ${km.format(entry.length / 1000)} km`)));
};
