import type { PosterTheme, RoseTheme } from 'traza/svg';

export interface DemoTheme {
    label: string;
    poster: PosterTheme;
    rose: RoseTheme;
    categories: Record<string, string>;
    other: string;
}

const roads = (color: string, scale: number) => ({
    motorway: { stroke: color, width: 2.4 * scale },
    primary: { stroke: color, width: 1.8 * scale },
    secondary: { stroke: color, width: 1.4 * scale },
    tertiary: { stroke: color, width: 1.1 * scale },
    residential: { stroke: color, width: 0.7 * scale },
    path: { stroke: color, width: 0.35 * scale, opacity: 0.7 },
});

const text = (fill: string, family: string) => ({
    title: { fill, fontSize: 22, fontFamily: family, fontWeight: 700, letterSpacing: 6, uppercase: true },
    subtitle: { fill, fontSize: 9, fontFamily: family, letterSpacing: 3, uppercase: true },
    coordinates: { fill, fontSize: 7, fontFamily: family, letterSpacing: 1, opacity: 0.75 },
    attribution: { fill, fontSize: 4, fontFamily: family, opacity: 0.6 },
});

export const THEMES: Record<string, DemoTheme> = {
    paper: {
        label: 'Paper',
        poster: {
            background: '#f3ede2',
            layers: {
                ...roads('#2b2622', 1),
                water: { fill: '#b9cfd8' },
                waterway: { stroke: '#b9cfd8', width: 1.5 },
                park: { fill: '#d5dcc3' },
                building: { fill: '#d9cfbf' },
            },
            text: text('#2b2622', 'Georgia, serif'),
            frame: { stroke: '#2b2622', width: 0.8 },
        },
        rose: { fill: '#2b2622', grid: { stroke: '#c9bfae', width: 0.5 }, labels: { fill: '#2b2622', fontSize: 10, fontFamily: 'Georgia, serif' } },
        categories: { women: '#b8336a', saints: '#3a6ea5', dates: '#e09f3e', heroes: '#2d6a4f', nature: '#6a994e' },
        other: '#cfc6b8',
    },
    night: {
        label: 'Night',
        poster: {
            background: '#0f1420',
            mapBackground: '#141b2b',
            layers: {
                ...roads('#f2c14e', 1),
                residential: { stroke: '#e8e2d0', width: 0.6 },
                path: { stroke: '#7d8597', width: 0.3 },
                water: { fill: '#1e3a5f' },
                waterway: { stroke: '#1e3a5f', width: 1.5 },
                park: { fill: '#1d2d25' },
                building: { fill: '#1b2232' },
            },
            text: text('#f2e9d8', 'Rotulo, system-ui, sans-serif'),
        },
        rose: { fill: '#f2c14e', background: '#0f1420', grid: { stroke: '#2a3348', width: 0.5 }, labels: { fill: '#f2e9d8', fontSize: 10 } },
        categories: { women: '#ff6b9a', saints: '#5fa8ff', dates: '#f2c14e', heroes: '#5ee6a8', nature: '#a3e35b' },
        other: '#3a4358',
    },
    blueprint: {
        label: 'Blueprint',
        poster: {
            background: '#1d4e89',
            layers: { ...roads('#eaf2ff', 0.9), water: { fill: '#163d6d' }, park: { fill: '#22558f' }, building: { fill: '#2a5d97' } },
            text: text('#eaf2ff', '"Courier New", monospace'),
            frame: { stroke: '#eaf2ff', width: 0.6 },
        },
        rose: { fill: '#eaf2ff', background: '#1d4e89', grid: { stroke: '#3c6ea8', width: 0.5 }, labels: { fill: '#eaf2ff', fontSize: 10 } },
        categories: { women: '#ffb3c6', saints: '#bde0fe', dates: '#ffd166', heroes: '#95d5b2', nature: '#caffbf' },
        other: '#6f95c3',
    },
};
