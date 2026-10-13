import type { OrientationResult } from '../orientation/index.js';
import { attrs, num, textElement } from './markup.js';
import type { TextStyle } from './markup.js';

export interface RoseTheme {
    background?: string;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    grid?: { stroke: string; width: number };
    labels?: TextStyle;
}

export interface RoseOptions {
    size?: number;
    scale?: 'area' | 'linear';
    labels?: [string, string, string, string];
    gridRings?: number;
    padding?: number;
}

const polar = (cx: number, cy: number, r: number, degrees: number): [number, number] => {
    const radians = degrees * Math.PI / 180;
    return [cx + r * Math.sin(radians), cy - r * Math.cos(radians)];
};

export const roseToSvg = (result: OrientationResult, theme: RoseTheme, options: RoseOptions = {}): string => {
    const size = options.size ?? 200;
    const padding = options.padding ?? (theme.labels ? theme.labels.fontSize * 1.6 : 0);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - padding;
    const max = Math.max(...result.bins.map((bin) => bin.share), 0);
    const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg"${attrs({ viewBox: `0 0 ${size} ${size}`, width: size, height: size })}>`];
    if (theme.background) {
        parts.push(`<rect${attrs({ width: size, height: size, fill: theme.background })}/>`);
    }
    if (theme.grid) {
        const rings = options.gridRings ?? 4;
        for (let i = 1; i <= rings; i++) {
            parts.push(`<circle${attrs({ cx, cy, r: radius * i / rings, fill: 'none', stroke: theme.grid.stroke, 'stroke-width': theme.grid.width })}/>`);
        }
    }
    const wedges = result.bins
        .filter((bin) => bin.share > 0 && max > 0)
        .map((bin) => {
            const ratio = bin.share / max;
            const r = radius * (options.scale === 'linear' ? ratio : Math.sqrt(ratio));
            const [x1, y1] = polar(cx, cy, r, bin.center - result.binWidth / 2);
            const [x2, y2] = polar(cx, cy, r, bin.center + result.binWidth / 2);
            return `M${num(cx)} ${num(cy)}L${num(x1)} ${num(y1)}A${num(r)} ${num(r)} 0 0 1 ${num(x2)} ${num(y2)}Z`;
        })
        .join('');
    parts.push(`<path${attrs({ d: wedges, fill: theme.fill, stroke: theme.stroke, 'stroke-width': theme.strokeWidth })}/>`);
    if (theme.labels) {
        const labels = options.labels ?? ['N', 'E', 'S', 'W'];
        const offset = radius + theme.labels.fontSize * 0.9;
        labels.forEach((label, index) => {
            const [x, y] = polar(cx, cy, offset, index * 90);
            parts.push(textElement(label, x, y + (theme.labels as TextStyle).fontSize * 0.35, 'middle', theme.labels as TextStyle));
        });
    }
    parts.push('</svg>');
    return parts.join('');
};
