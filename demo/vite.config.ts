import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const src = (path: string): string => fileURLToPath(new URL(`../src/${path}`, import.meta.url));

const subpaths = ['osm', 'sources', 'orientation', 'stats', 'names', 'poster', 'svg', 'ol'];

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    base: './',
    resolve: {
        alias: [
            ...subpaths.map((name) => ({ find: new RegExp(`^traza/${name}$`), replacement: src(`${name}/index.ts`) })),
            { find: /^traza$/, replacement: src('core/index.ts') },
        ],
    },
    build: {
        outDir: fileURLToPath(new URL('../demo-dist', import.meta.url)),
        emptyOutDir: true,
    },
});
