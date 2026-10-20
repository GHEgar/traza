import type { LonLat } from '@npmegar/traza';

export interface Place {
    label: string;
    title: string;
    subtitle: string;
    center: LonLat;
    radius: number;
}

export const PLACES: Place[] = [
    { label: 'Guadalajara · Centro', title: 'Guadalajara', subtitle: 'Jalisco · México', center: [-103.3475, 20.6767], radius: 1200 },
    { label: 'Ciudad de México · Centro', title: 'Ciudad de México', subtitle: 'Centro Histórico', center: [-99.1332, 19.4326], radius: 1200 },
    { label: 'Puebla · Centro', title: 'Puebla', subtitle: 'Puebla · México', center: [-98.1977, 19.0433], radius: 1200 },
    { label: 'Barcelona · Eixample', title: 'Barcelona', subtitle: 'Eixample', center: [2.1640, 41.3910], radius: 1000 },
    { label: 'Paris · Île de la Cité', title: 'Paris', subtitle: 'Île-de-France', center: [2.3470, 48.8540], radius: 1000 },
    { label: 'Roma · Centro Storico', title: 'Roma', subtitle: 'Lazio · Italia', center: [12.4770, 41.8990], radius: 1000 },
];
