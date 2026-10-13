export type {
    AreaFeature,
    AreaKind,
    BBox,
    DataSource,
    Extras,
    LonLat,
    Point,
    RoadClass,
    StreetEdge,
    StreetNetwork,
    StreetNode,
    WaterLine,
} from './types.js';
export { bboxArea, bboxAround, bboxOf, bearing, distance, EARTH_RADIUS, lineLength, ringArea, toDegrees, toRadians } from './geo.js';
export { createProjection } from './projection.js';
export type { Projection } from './projection.js';
export { osmRoadClass, ROAD_CLASSES } from './classes.js';
export {
    buildNetwork,
    filterNetwork,
    mergeNetworks,
    needsOsmAttribution,
    networkBBox,
    nodeDegrees,
    OSM_ATTRIBUTION,
} from './network.js';
export type { NetworkLine } from './network.js';
