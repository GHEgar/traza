import type { PosterScene, SceneLayer, TextRole } from '../poster/index.js';
import { attrs, pathData, textElement } from './markup.js';
import type { TextStyle } from './markup.js';

export interface LayerStyle {
    stroke?: string;
    fill?: string;
    width?: number;
    opacity?: number;
    linecap?: 'round' | 'butt' | 'square';
}

export interface FrameStyle {
    stroke: string;
    width: number;
}

export interface PosterTheme {
    background: string;
    mapBackground?: string;
    layers: Record<string, LayerStyle>;
    defaultLayer?: LayerStyle;
    text: Partial<Record<TextRole, TextStyle>>;
    frame?: FrameStyle;
}

export interface SvgOptions {
    idPrefix?: string;
}

const layerElement = (layer: SceneLayer, style: LayerStyle): string => {
    const isArea = layer.kind === 'area';
    return `<path${attrs({
        d: pathData(layer.paths, isArea),
        fill: isArea ? style.fill ?? 'none' : 'none',
        'fill-rule': isArea ? 'evenodd' : undefined,
        stroke: style.stroke ?? (isArea ? undefined : 'currentColor'),
        'stroke-width': style.width ?? (isArea ? undefined : 1),
        'stroke-linecap': isArea ? undefined : style.linecap ?? 'round',
        'stroke-linejoin': isArea ? undefined : 'round',
        opacity: style.opacity,
        'data-layer': layer.id,
    })}/>`;
};

const attributionStyle = (scene: PosterScene, theme: PosterTheme): TextStyle => theme.text.attribution ?? {
    fill: theme.text.coordinates?.fill ?? theme.text.title?.fill ?? 'currentColor',
    fontSize: Math.max(scene.width * 0.012, 2),
    ...(theme.text.coordinates?.fontFamily ? { fontFamily: theme.text.coordinates.fontFamily } : {}),
};

export const posterToSvg = (scene: PosterScene, theme: PosterTheme, options: SvgOptions = {}): string => {
    const clipId = `${options.idPrefix ?? 'traza'}-clip`;
    const { frame } = scene;
    const shape = frame.shape === 'circle'
        ? `<circle${attrs({ cx: frame.cx, cy: frame.cy, r: frame.r })}/>`
        : `<rect${attrs({ x: frame.x, y: frame.y, width: frame.width, height: frame.height })}/>`;
    const parts: string[] = [
        `<svg xmlns="http://www.w3.org/2000/svg"${attrs({ viewBox: `0 0 ${scene.width} ${scene.height}`, width: scene.width, height: scene.height })}>`,
        `<defs><clipPath id="${clipId}">${shape}</clipPath></defs>`,
        `<rect${attrs({ width: scene.width, height: scene.height, fill: theme.background })}/>`,
    ];
    if (theme.mapBackground) {
        parts.push(shape.replace('/>', `${attrs({ fill: theme.mapBackground })}/>`));
    }
    parts.push(`<g clip-path="url(#${clipId})">`);
    for (const layer of scene.layers) {
        const style = theme.layers[layer.id] ?? theme.defaultLayer;
        if (style) {
            parts.push(layerElement(layer, style));
        }
    }
    parts.push('</g>');
    if (theme.frame) {
        parts.push(shape.replace('/>', `${attrs({ fill: 'none', stroke: theme.frame.stroke, 'stroke-width': theme.frame.width })}/>`));
    }
    for (const text of scene.texts) {
        const style = text.role === 'attribution' ? attributionStyle(scene, theme) : theme.text[text.role];
        if (style) {
            parts.push(textElement(text.text, text.x, text.y, text.anchor, style));
        }
    }
    parts.push('</svg>');
    return parts.join('');
};
