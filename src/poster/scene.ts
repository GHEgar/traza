import { createProjection, distance, networkBBox, OSM_ATTRIBUTION, ROAD_CLASSES } from '../core/index.js';
import type { Extras, LonLat, Point, StreetEdge, StreetNetwork } from '../core/index.js';
import { formatCoordinates } from './format.js';
import type { CoordinateFormat } from './format.js';

export type FrameShape = 'circle' | 'rect';

export interface Frame {
    shape: FrameShape;
    x: number;
    y: number;
    width: number;
    height: number;
    cx: number;
    cy: number;
    r: number;
}

export interface SceneLayer {
    id: string;
    kind: 'area' | 'line';
    paths: Point[][];
}

export type TextRole = 'title' | 'subtitle' | 'coordinates' | 'attribution';

export interface SceneText {
    role: TextRole;
    text: string;
    x: number;
    y: number;
    anchor: 'start' | 'middle' | 'end';
}

export interface PosterScene {
    width: number;
    height: number;
    frame: Frame;
    layers: SceneLayer[];
    texts: SceneText[];
    attribution: string | null;
    scale: number;
}

export interface PosterOptions {
    network: StreetNetwork;
    extras?: Extras;
    center?: LonLat;
    radius?: number;
    shape?: FrameShape;
    width?: number;
    height?: number;
    margin?: number;
    textHeight?: number;
    edgeKey?: (edge: StreetEdge) => string;
    layerOrder?: string[];
    title?: string;
    subtitle?: string;
    coordinates?: string | false | CoordinateFormat;
    attribution?: string;
    precision?: number;
}

const defaultExtent = (network: StreetNetwork): { center: LonLat; radius: number } => {
    const [west, south, east, north] = networkBBox(network);
    const center: LonLat = [(west + east) / 2, (south + north) / 2];
    const halfWidth = distance([west, center[1]], [east, center[1]]) / 2;
    const halfHeight = distance([center[0], south], [center[0], north]) / 2;
    return { center, radius: Math.max(Math.min(halfWidth, halfHeight), 1) };
};

const frameOf = (shape: FrameShape, width: number, height: number, margin: number, textHeight: number): Frame => {
    const x = margin;
    const y = margin;
    const w = width - 2 * margin;
    const h = height - 2 * margin - textHeight;
    const r = Math.min(w, h) / 2;
    const cx = x + w / 2;
    const cy = y + h / 2;
    if (shape === 'circle') {
        return { shape, x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, cx, cy, r };
    }
    return { shape, x, y, width: w, height: h, cx, cy, r };
};

const DEFAULT_ORDER = ['water', 'park', 'building', 'waterway', ...[...ROAD_CLASSES].reverse()];

export const createPosterScene = (options: PosterOptions): PosterScene => {
    const { network } = options;
    const width = options.width ?? 300;
    const height = options.height ?? 400;
    const margin = options.margin ?? width * 0.08;
    const textHeight = options.textHeight ?? height * 0.16;
    const extent = defaultExtent(network);
    const center = options.center ?? extent.center;
    const radius = options.radius ?? extent.radius;
    const frame = frameOf(options.shape ?? 'circle', width, height, margin, textHeight);
    const scale = frame.r / radius;
    const projection = createProjection(center);
    const factor = 10 ** (options.precision ?? 2);
    const round = (value: number): number => Math.round(value * factor) / factor;
    const halfX = frame.width / 2;
    const halfY = frame.height / 2;
    const project = (coords: LonLat[]): Point[] => coords.map((coord) => {
        const [px, py] = projection.forward(coord);
        return [round(frame.cx + px * scale), round(frame.cy - py * scale)] as Point;
    });
    const visible = (points: Point[]): boolean => points.some(([x, y]) =>
        Math.abs(x - frame.cx) <= halfX * 1.05 && Math.abs(y - frame.cy) <= halfY * 1.05);
    const place = (coords: LonLat[]): Point[] | null => {
        const points = project(coords);
        return points.length >= 2 && visible(points) ? points : null;
    };
    const groups = new Map<string, SceneLayer>();
    const push = (id: string, kind: SceneLayer['kind'], path: Point[] | null): void => {
        if (!path) {
            return;
        }
        const layer = groups.get(id) ?? { id, kind, paths: [] };
        layer.paths.push(path);
        groups.set(id, layer);
    };
    for (const area of options.extras?.areas ?? []) {
        const rings = area.rings.map(project);
        if (rings.some(visible)) {
            rings.forEach((ring) => push(area.kind, 'area', ring));
        }
    }
    for (const line of options.extras?.waterways ?? []) {
        push('waterway', 'line', place(line.coords));
    }
    const keyOf = options.edgeKey ?? ((edge: StreetEdge) => edge.roadClass);
    for (const edge of network.edges) {
        push(keyOf(edge), 'line', place(edge.coords));
    }
    const order = options.layerOrder ?? DEFAULT_ORDER;
    const layers = [...groups.values()].sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    });
    const attribution = network.sources.includes('osm')
        ? [OSM_ATTRIBUTION, options.attribution].filter(Boolean).join(' · ')
        : options.attribution ?? null;
    const middle = width / 2;
    const textTop = height - margin - textHeight;
    const texts: SceneText[] = [];
    if (options.title) {
        texts.push({ role: 'title', text: options.title, x: middle, y: textTop + textHeight * 0.45, anchor: 'middle' });
    }
    if (options.subtitle) {
        texts.push({ role: 'subtitle', text: options.subtitle, x: middle, y: textTop + textHeight * 0.68, anchor: 'middle' });
    }
    if (options.coordinates !== false) {
        const text = typeof options.coordinates === 'string' ? options.coordinates : formatCoordinates(center, options.coordinates);
        texts.push({ role: 'coordinates', text, x: middle, y: textTop + textHeight * 0.88, anchor: 'middle' });
    }
    if (attribution) {
        texts.push({ role: 'attribution', text: attribution, x: width - margin, y: height - margin * 0.4, anchor: 'end' });
    }
    return { width, height, frame, layers, texts, attribution, scale };
};
