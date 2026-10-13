import { describe, expect, it } from 'vitest';
import { buildNetwork } from '../src/core/index.js';
import { categorizeNetwork, createCategorizer, parseStreetName, streetTypes, topStreetNames } from '../src/names/index.js';
import type { NameRule } from '../src/names/index.js';

const rules: NameRule[] = [
    { id: 'women', match: ['Josefa Ortiz de Domínguez', 'Leona Vicario', 'Sor Juana Inés de la Cruz'] },
    { id: 'saints', match: /^(san|santa|santo) / },
    { id: 'dates', match: (name) => /^\d{1,2} de [a-z]+$/.test(name.key) },
];

describe('parseStreetName', () => {
    it('splits the street type and normalizes the key', () => {
        expect(parseStreetName('Av. Juárez')).toEqual({ raw: 'Av. Juárez', type: 'Avenida', base: 'Juárez', key: 'juarez' });
        expect(parseStreetName('Calz.  Independencia Sur').type).toBe('Calzada');
        expect(parseStreetName('Gral. Ramón Corona').key).toBe('general ramon corona');
        expect(parseStreetName('Calle de la Paz').key).toBe('la paz');
    });

    it('does not take a lone word as the type', () => {
        expect(parseStreetName('Avenida')).toMatchObject({ type: null, key: 'avenida' });
    });
});

describe('createCategorizer', () => {
    const categorize = createCategorizer(rules);

    it('matches lists, regex and functions in order', () => {
        expect(categorize('Calle Leona Vicario')).toBe('women');
        expect(categorize('Av. Sta. Margarita')).toBe('saints');
        expect(categorize('Calle 5 de Mayo')).toBe('dates');
        expect(categorize('Calle Hidalgo')).toBeNull();
        expect(categorize(null)).toBeNull();
    });

    it('matches list entries as whole words', () => {
        expect(createCategorizer([{ id: 'x', match: ['paz'] }])('Calle La Paz Norte')).toBe('x');
        expect(createCategorizer([{ id: 'x', match: ['paz'] }])('Calle Pazcual')).toBeNull();
    });
});

describe('network rankings', () => {
    const network = buildNetwork([
        { id: 'a', nodeIds: ['1', '2'], coords: [[0, 0], [0.002, 0]], roadClass: 'primary', name: 'Av. Juárez' },
        { id: 'b', nodeIds: ['2', '3'], coords: [[0.002, 0], [0.003, 0]], roadClass: 'primary', name: 'Avenida Juarez' },
        { id: 'c', nodeIds: ['2', '4'], coords: [[0.002, 0], [0.002, 0.001]], roadClass: 'residential', name: 'Calle Leona Vicario' },
        { id: 'd', nodeIds: ['4', '5'], coords: [[0.002, 0.001], [0.002, 0.002]], roadClass: 'residential', name: null },
    ], ['custom']);

    it('groups spellings of the same name', () => {
        const [first] = topStreetNames(network);
        expect(first).toMatchObject({ key: 'juarez', name: 'Juárez', edges: 2 });
    });

    it('filters rankings by road class', () => {
        expect(topStreetNames(network, { classes: ['residential'] }).map((entry) => entry.key)).toEqual(['leona vicario']);
    });

    it('sums lengths by street type', () => {
        expect(streetTypes(network).map((entry) => entry.type)).toEqual(['Avenida', 'Calle']);
    });

    it('summarizes categories by length', () => {
        const result = categorizeNetwork(network, rules);
        expect(result.byEdge.get('c:0')).toBe('women');
        expect(result.categories.find((entry) => entry.id === 'women')).toMatchObject({ edges: 1, names: 1 });
        expect(result.uncategorized).toBeGreaterThan(0);
        expect(result.unnamed).toBeGreaterThan(0);
    });
});
