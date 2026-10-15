import type { Point } from '../core/index.js';

export interface TextStyle {
    fill: string;
    fontSize: number;
    fontFamily?: string;
    fontWeight?: string | number;
    letterSpacing?: number;
    uppercase?: boolean;
    opacity?: number;
    advance?: number;
}

export const escapeXml = (text: string): string => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const num = (value: number): string => String(Math.round(value * 100) / 100);

export const attrs = (values: Record<string, string | number | undefined>): string => Object.entries(values)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => ` ${key}="${escapeXml(typeof value === 'number' ? num(value) : value)}"`)
    .join('');

export const pathData = (paths: Point[][], closed: boolean): string => paths
    .map((path) => path.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${num(x)} ${num(y)}`).join('') + (closed ? 'Z' : ''))
    .join('');

export const estimateWidth = (content: string, style: TextStyle): number => {
    const caps = content === content.toLocaleUpperCase() && content !== content.toLocaleLowerCase();
    const advance = style.advance ?? (caps ? 0.75 : 0.6);
    return [...content].length * (advance * style.fontSize + (style.letterSpacing ?? 0));
};

export const textElement = (text: string, x: number, y: number, anchor: string, style: TextStyle, maxWidth?: number): string => {
    const content = style.uppercase ? text.toLocaleUpperCase() : text;
    const fit = maxWidth !== undefined && maxWidth > 0 && estimateWidth(content, style) > maxWidth;
    return `<text${attrs({
        x,
        y,
        'text-anchor': anchor,
        fill: style.fill,
        'font-size': style.fontSize,
        'font-family': style.fontFamily,
        'font-weight': style.fontWeight,
        'letter-spacing': style.letterSpacing,
        opacity: style.opacity,
        textLength: fit ? maxWidth : undefined,
        lengthAdjust: fit ? 'spacingAndGlyphs' : undefined,
    })}>${escapeXml(content)}</text>`;
};
