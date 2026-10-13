import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import VectorSource from 'ol/source/Vector.js';
import type { StyleLike } from 'ol/style/Style.js';
import { ROAD_CLASSES } from '../core/index.js';
import type { StreetNetwork } from '../core/index.js';
import { edgeBearing } from '../orientation/index.js';

export interface StreetFeatureOptions {
    projection?: string;
    categorize?: (name: string | null) => string | null;
}

export interface StreetLayerOptions extends StreetFeatureOptions {
    style?: StyleLike;
}

export const networkToFeatures = (network: StreetNetwork, options: StreetFeatureOptions = {}): Feature<LineString>[] => {
    const projection = options.projection ?? 'EPSG:3857';
    return network.edges.map((edge) => {
        const feature = new Feature({
            geometry: new LineString(edge.coords.map((coord) => fromLonLat(coord, projection))),
            edgeId: edge.id,
            roadClass: edge.roadClass,
            classIndex: ROAD_CLASSES.indexOf(edge.roadClass),
            name: edge.name,
            length: edge.length,
            bearing: edgeBearing(edge),
            category: options.categorize ? options.categorize(edge.name) : null,
        });
        feature.setId(edge.id);
        return feature;
    });
};

export const createStreetLayer = (
    network: StreetNetwork,
    options: StreetLayerOptions = {},
): VectorLayer<VectorSource<Feature<LineString>>> => {
    const source = new VectorSource<Feature<LineString>>({
        features: networkToFeatures(network, options),
        ...(network.sources.includes('osm') ? { attributions: '© OpenStreetMap contributors' } : {}),
    });
    return new VectorLayer({ source, ...(options.style ? { style: options.style } : {}) });
};
