import 'rotulo';
import fontUrl from 'rotulo/fonts/Rotulo-Variable.woff2?url';
import { bboxAround } from '@npmegar/traza';
import type { Extras, RoadClass, StreetNetwork } from '@npmegar/traza';
import { loadOsm } from '@npmegar/traza/osm';
import { orientation } from '@npmegar/traza/orientation';
import { networkStats } from '@npmegar/traza/stats';
import { categorizeNetwork, streetTypes, topStreetNames } from '@npmegar/traza/names';
import { createPosterScene } from '@npmegar/traza/poster';
import { posterToSvg, roseToSvg } from '@npmegar/traza/svg';
import type { PosterTheme } from '@npmegar/traza/svg';
import { PLACES } from './places.js';
import type { Place } from './places.js';
import { RULES } from './rules.js';
import { THEMES } from './themes.js';
import { renderNames, renderStats } from './panels.js';

const $ = <T extends Element>(selector: string): T => document.querySelector(selector) as T;
const form = $<HTMLFormElement>('#controls');
const status = $<HTMLOutputElement>('#status');
const field = <T extends Element>(name: string): T => form.elements.namedItem(name) as unknown as T;
const ROADS: RoadClass[] = ['motorway', 'primary', 'secondary', 'tertiary', 'residential'];
const cache = new Map<string, { network: StreetNetwork; extras: Extras }>();
let current: { svg: string; name: string } | null = null;
let controller: AbortController | null = null;

const place = field<HTMLSelectElement>('place');
PLACES.forEach((entry, index) => place.add(new Option(entry.label, String(index))));
const theme = field<HTMLSelectElement>('theme');
Object.entries(THEMES).forEach(([key, entry]) => theme.add(new Option(entry.label, key)));
const radius = field<HTMLInputElement>('radius');
radius.value = String(PLACES[0]?.radius ?? 1000);
place.addEventListener('change', () => {
    radius.value = String(PLACES[Number(place.value)]?.radius ?? 1000);
});

const checked = (name: string): boolean => field<HTMLInputElement>(name).checked;

const load = async (): Promise<{ network: StreetNetwork; extras: Extras }> => {
    const chosen = PLACES[Number(place.value)] ?? PLACES[0];
    if (!chosen) {
        throw new Error('No places');
    }
    const layers = { water: checked('water'), parks: checked('parks'), buildings: checked('buildings') };
    const key = JSON.stringify([place.value, radius.value, layers]);
    const hit = cache.get(key);
    if (hit) {
        return hit;
    }
    controller?.abort();
    controller = new AbortController();
    const data = await loadOsm({ bbox: bboxAround(chosen.center, Number(radius.value) * 1.05) }, { ...layers, signal: controller.signal, endpoint: field<HTMLSelectElement>('endpoint').value });
    cache.set(key, data);
    return data;
};

interface Shown {
    place: Place;
    radius: number;
    network: StreetNetwork;
    extras: Extras;
}

let shown: Shown | null = null;

const draw = ({ place: chosen, radius: size, network: streets, extras }: Shown): void => {
    const look = THEMES[theme.value];
    if (!look) {
        return;
    }
    const categories = categorizeNetwork(streets, RULES);
    const byNames = field<HTMLSelectElement>('color').value === 'names';
    const scene = createPosterScene({
        network: streets,
        extras,
        center: chosen.center,
        radius: size,
        shape: field<HTMLSelectElement>('shape').value === 'rect' ? 'rect' : 'circle',
        title: chosen.title,
        subtitle: chosen.subtitle,
        ...(byNames ? { edgeKey: (edge) => categories.byEdge.get(edge.id) ?? 'other' } : {}),
    });
    const posterTheme: PosterTheme = byNames
        ? {
            ...look.poster,
            layers: {
                ...look.poster.layers,
                other: { stroke: look.other, width: 0.6 },
                ...Object.fromEntries(Object.entries(look.categories).map(([id, color]) => [id, { stroke: color, width: 1.4 }])),
            },
        }
        : look.poster;
    const svg = posterToSvg(scene, posterTheme);
    $('#poster').innerHTML = svg;
    current = { svg, name: chosen.title.toLowerCase().replace(/\s+/g, '-') };
    const rose = orientation(streets, { classes: ROADS });
    $('#rose').innerHTML = roseToSvg(rose, look.rose, { size: 220, labels: ['N', 'E', 'S', 'W'] });
    $('#order').textContent = `Order φ = ${rose.order.toFixed(3)} · entropy ${rose.entropy.toFixed(3)}`;
    renderStats($('#stats'), networkStats(streets, { area: Math.PI * size ** 2 }), streetTypes(streets, { classes: ROADS }));
    renderNames($('#categories'), $('#names'), categories, topStreetNames(streets, { limit: 8, classes: ROADS }), look.categories);
    $<HTMLButtonElement>('#export-svg').disabled = false;
    $<HTMLButtonElement>('#export-png').disabled = false;
    status.value = `${chosen.label} · ${streets.edges.length} segments`;
};

const render = async (): Promise<void> => {
    const chosen = PLACES[Number(place.value)];
    if (!chosen) {
        return;
    }
    status.value = 'Querying Overpass…';
    try {
        const { network, extras } = await load();
        shown = { place: chosen, radius: Number(radius.value), network, extras };
        draw(shown);
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            status.value = `${(error as Error).message}${shown ? ` · showing ${shown.place.label}` : ''}`;
        }
    }
};

const download = (blob: Blob, name: string): void => {
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    link.click();
    URL.revokeObjectURL(url);
};

$('#export-svg').addEventListener('click', () => {
    if (current) {
        download(new Blob([current.svg], { type: 'image/svg+xml' }), `${current.name}.svg`);
    }
});

let fontFace: Promise<string> | null = null;

const embeddedFont = (): Promise<string> => {
    fontFace ??= fetch(fontUrl)
        .then((response) => response.blob())
        .then((blob) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        }))
        .then((base64) => `<style>@font-face{font-family:Rotulo;src:url(data:font/woff2;base64,${base64}) format('woff2');font-weight:200 700}</style>`)
        .catch(() => {
            fontFace = null;
            return '';
        });
    return fontFace;
};

$('#export-png').addEventListener('click', async () => {
    if (!current) {
        return;
    }
    const { svg: markup, name } = current;
    const style = await embeddedFont();
    const svg = markup.replace(/<svg[^>]*>/, (open) => open + style);
    const image = new Image();
    image.onload = () => {
        const scale = 8;
        const canvas = Object.assign(document.createElement('canvas'), { width: image.width * scale, height: image.height * scale });
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob && download(blob, `${name}.png`));
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    void render();
});
form.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (['theme', 'shape', 'color'].includes(target.name) && shown) {
        draw(shown);
    }
});
