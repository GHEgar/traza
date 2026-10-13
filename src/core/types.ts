export type LonLat = [number, number];

export type Point = [number, number];

export type BBox = [number, number, number, number];

export type RoadClass = 'motorway' | 'primary' | 'secondary' | 'tertiary' | 'residential' | 'path';

export type DataSource = 'osm' | 'custom';

export interface StreetNode {
    id: string;
    coord: LonLat;
}

export interface StreetEdge {
    id: string;
    from: string;
    to: string;
    coords: LonLat[];
    length: number;
    roadClass: RoadClass;
    name: string | null;
    tags: Record<string, string>;
}

export interface StreetNetwork {
    nodes: Map<string, StreetNode>;
    edges: StreetEdge[];
    sources: DataSource[];
}

export type AreaKind = 'water' | 'park' | 'building';

export interface AreaFeature {
    kind: AreaKind;
    rings: LonLat[][];
}

export interface WaterLine {
    kind: 'waterway';
    coords: LonLat[];
}

export interface Extras {
    areas: AreaFeature[];
    waterways: WaterLine[];
}
