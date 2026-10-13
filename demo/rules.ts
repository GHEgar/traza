import type { NameRule } from 'traza/names';

export const RULES: NameRule[] = [
    {
        id: 'women',
        match: [
            'Josefa Ortiz de Domínguez', 'Leona Vicario', 'Sor Juana Inés de la Cruz', 'Rita Pérez de Moreno',
            'Gertrudis Bocanegra', 'Frida Kahlo', 'Rosario Castellanos', 'Margarita Maza', 'Carmen Serdán',
            'Mariana Rodríguez del Toro', 'Hermila Galindo', 'Elvia Carrillo Puerto', 'Juana de Arco', 'Marie Curie',
            'Clara Campoamor', 'Rosalía de Castro', 'Emilia Pardo Bazán', 'Gabriela Mistral', 'Isabel la Católica',
        ],
    },
    { id: 'saints', match: /^(san|santa|santo|santisima|virgen|nuestra senora|sant|saint|sainte) / },
    { id: 'dates', match: (name) => /^\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/.test(name.key) },
    {
        id: 'heroes',
        match: [
            'Hidalgo', 'Morelos', 'Juárez', 'Allende', 'Aldama', 'Guerrero', 'Zaragoza', 'Madero', 'Zapata', 'Villa',
            'Carranza', 'Obregón', 'Independencia', 'Revolución', 'Reforma', 'Constitución', 'Abasolo', 'Matamoros',
            'Galeana', 'Bravo', 'Victoria', 'Mina', 'Jiménez', 'Ocampo', 'Corona', 'Colón', 'Cuauhtémoc',
        ],
    },
    { id: 'nature', match: /\b(rosa|rosas|jazmin|lirio|tulipan|gardenia|bugambilia|violeta|orquidea|clavel|pino|pinos|olivo|cedro|roble|fresno|sauce|laurel|rio|lago|volcan|sol|luna|estrella)\b/ },
];

export const CATEGORY_LABELS: Record<string, string> = {
    women: 'Mujeres',
    saints: 'Santos y vírgenes',
    dates: 'Fechas',
    heroes: 'Próceres y gestas',
    nature: 'Naturaleza',
};
