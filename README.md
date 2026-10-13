# traza

Headless street infographics. traza takes a street network — from OpenStreetMap or from your own
GeoJSON/WFS layer — and gives you the data for four pieces: a city poster, a street orientation rose,
network statistics and street-name maps. You own every pixel: the optional SVG serializer only draws
with the theme you pass.

```bash
npm install traza
```

```ts
import { bboxAround } from 'traza';
import { loadOsm } from 'traza/osm';
import { orientation } from 'traza/orientation';
import { createPosterScene } from 'traza/poster';
import { posterToSvg, roseToSvg } from 'traza/svg';

const center: [number, number] = [-103.3475, 20.6767];
const { network, extras } = await loadOsm({ bbox: bboxAround(center, 1000) }, { water: true, parks: true });

const scene = createPosterScene({ network, extras, center, radius: 1000, title: 'Guadalajara', subtitle: 'Centro' });
const svg = posterToSvg(scene, {
    background: '#f3ede2',
    layers: {
        primary: { stroke: '#2b2622', width: 1.8 },
        residential: { stroke: '#2b2622', width: 0.7 },
        park: { fill: '#d5dcc3' },
        water: { fill: '#b9cfd8' },
    },
    text: { title: { fill: '#2b2622', fontSize: 22, letterSpacing: 6, uppercase: true } },
});

const rose = roseToSvg(orientation(network), { fill: '#2b2622' });
```

## Subpaths

| Import | What it does | Depends on |
|---|---|---|
| `traza` | Street network model, geodesic helpers, local projection | — |
| `traza/osm` | Overpass query, fetch with area cap and `AbortSignal`, parser to network, water, parks and buildings | `fetch` |
| `traza/sources` | GeoJSON and paged WFS (`CRS:84`) to network, joining vertices within a tolerance | `fetch` |
| `traza/orientation` | Length-weighted bearing histogram, entropy and orientation order φ | — |
| `traza/stats` | Length by class, intersections, dead ends, degree, circuity, density | — |
| `traza/names` | Street-name parsing (Mexican street types and abbreviations), categories from your rules, rankings | — |
| `traza/poster` | Poster scene: projected layers, circle or rectangle frame, title block, attribution | — |
| `traza/svg` | Poster and rose to SVG with your theme | — |
| `traza/ol` | OpenLayers features and layer with `roadClass`, `classIndex`, `bearing` and `category` | `ol` |

## Orientation

Each segment counts in its bearing and the opposite one, weighted by length, in 36 bins centered on
north. Entropy is Shannon's `Hₒ`; order is `φ = 1 − ((Hₒ − H_g) / (H_max − H_g))²`, with `H_g = ln 4`
(a perfect grid) and `H_max = ln 36`. A perfect grid gives `φ = 1`; evenly spread streets give `φ ≈ 0`.
The method follows Boeing (2019), *Urban spatial order: street network orientation, configuration,
and entropy*.

## Street names

```ts
import { categorizeNetwork } from 'traza/names';

const { byEdge, categories } = categorizeNetwork(network, [
    { id: 'women', match: ['Leona Vicario', 'Josefa Ortiz de Domínguez'] },
    { id: 'saints', match: /^(san|santa|santo) / },
    { id: 'dates', match: (name) => /^\d{1,2} de /.test(name.key) },
]);

const scene = createPosterScene({ network, edgeKey: (edge) => byEdge.get(edge.id) ?? 'other' });
```

Lists match whole words of the normalized name (`Av. Gral. Ramón Corona` → `general ramon corona`);
regular expressions run against the normalized key and the raw name; functions receive the parsed
name. The first rule that matches wins.

## Your own data

```ts
import { loadWfsNetwork } from 'traza/sources';

const network = await loadWfsNetwork({
    url: 'https://example.org/geoserver/wfs',
    typeName: 'ws:streets',
    bbox: [-103.36, 20.66, -103.33, 20.69],
    name: (properties) => `${properties.TIPOVIAL} ${properties.NOMVIAL}`,
    roadClass: (properties) => properties.TIPOVIAL === 'Avenida' ? 'primary' : 'residential',
    tolerance: 1,
});
```

## OpenStreetMap

Data from OpenStreetMap is © OpenStreetMap contributors under the ODbL. When a network comes from OSM
the poster scene always carries that attribution and `posterToSvg` always draws it; your own
`attribution` is appended, never a replacement.

Be gentle with Overpass: `loadOsm` refuses areas above `maxArea` (25 km² by default) and never retries.
In Node, pass a descriptive `userAgent`: the main instance answers 406 to generic ones.

## Demo

```bash
npm run demo
```

## License

AGPL-3.0-only
