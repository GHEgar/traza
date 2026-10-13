export interface StreetType {
    type: string;
    aliases: string[];
}

export interface ParsedName {
    raw: string;
    type: string | null;
    base: string;
    key: string;
}

export const MX_STREET_TYPES: StreetType[] = [
    { type: 'Calle', aliases: ['calle'] },
    { type: 'Avenida', aliases: ['avenida', 'av', 'ave', 'avda'] },
    { type: 'Calzada', aliases: ['calzada', 'calz'] },
    { type: 'Boulevard', aliases: ['boulevard', 'bulevar', 'blvd', 'bvd'] },
    { type: 'Privada', aliases: ['privada', 'priv'] },
    { type: 'Andador', aliases: ['andador', 'and'] },
    { type: 'Prolongación', aliases: ['prolongacion', 'prol'] },
    { type: 'Circuito', aliases: ['circuito', 'cto'] },
    { type: 'Callejón', aliases: ['callejon', 'cjon'] },
    { type: 'Cerrada', aliases: ['cerrada', 'cda'] },
    { type: 'Periférico', aliases: ['periferico', 'perif'] },
    { type: 'Carretera', aliases: ['carretera', 'carr'] },
    { type: 'Libramiento', aliases: ['libramiento', 'lib'] },
    { type: 'Paseo', aliases: ['paseo'] },
    { type: 'Glorieta', aliases: ['glorieta'] },
    { type: 'Retorno', aliases: ['retorno', 'ret'] },
    { type: 'Camino', aliases: ['camino'] },
    { type: 'Viaducto', aliases: ['viaducto'] },
    { type: 'Diagonal', aliases: ['diagonal'] },
    { type: 'Pasaje', aliases: ['pasaje'] },
    { type: 'Eje', aliases: ['eje'] },
];

export const MX_ABBREVIATIONS: Record<string, string> = {
    gral: 'general',
    lic: 'licenciado',
    dr: 'doctor',
    dra: 'doctora',
    ing: 'ingeniero',
    prof: 'profesor',
    profa: 'profesora',
    pdte: 'presidente',
    cap: 'capitan',
    cnel: 'coronel',
    sta: 'santa',
    sto: 'santo',
    sn: 'san',
    fray: 'fray',
    fco: 'francisco',
    ma: 'maria',
    gpe: 'guadalupe',
    jma: 'jose maria',
};

export const fold = (text: string): string => text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export interface ParseOptions {
    types?: StreetType[];
    abbreviations?: Record<string, string>;
}

export const parseStreetName = (raw: string, options: ParseOptions = {}): ParsedName => {
    const types = options.types ?? MX_STREET_TYPES;
    const abbreviations = options.abbreviations ?? MX_ABBREVIATIONS;
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    const [first = '', ...rest] = trimmed.split(' ');
    const head = fold(first);
    const match = rest.length > 0 ? types.find((type) => type.aliases.includes(head)) : undefined;
    const base = match ? rest.join(' ') : trimmed;
    const words = fold(base).split(' ').filter((word) => word !== '');
    const expanded = words.flatMap((word) => (abbreviations[word] ?? word).split(' '));
    const key = (expanded[0] === 'de' || expanded[0] === 'del') && expanded.length > 1
        ? expanded.slice(1).join(' ')
        : expanded.join(' ');
    return { raw: trimmed, type: match?.type ?? null, base, key };
};
