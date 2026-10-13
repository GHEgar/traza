import { describe, expect, it } from 'vitest';
import { createStreetLayer, networkToFeatures } from '../src/ol/index.js';
import { createCategorizer } from '../src/names/index.js';
import { grid } from './helpers.js';

describe('traza/ol', () => {
    it('turns edges into features with attributes', () => {
        const categorize = createCategorizer([{ id: 'colon', match: ['colon'] }]);
        const features = networkToFeatures(grid(1), { categorize });
        expect(features).toHaveLength(4);
        const avenue = features.find((feature) => feature.get('roadClass') === 'primary');
        expect(avenue?.get('category')).toBe('colon');
        expect(avenue?.get('classIndex')).toBe(1);
        expect(avenue?.get('bearing')).toBeCloseTo(0, 1);
        expect(avenue?.getGeometry()?.getCoordinates()[0]?.[0]).toBeLessThan(-1e7);
    });

    it('builds a layer with the OSM attribution', () => {
        const layer = createStreetLayer(grid(1));
        expect(layer.getSource()?.getFeatures()).toHaveLength(4);
        expect(layer.getSource()?.getAttributions()).toBeTruthy();
    });
});
