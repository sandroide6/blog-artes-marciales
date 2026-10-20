export type DisciplineId = 'karate' | 'bjj' | 'muay-thai' | 'boxeo' | 'mma';

export interface DisciplineInfo {
  id: DisciplineId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  origin: string;
  accentColor: string; // Hex color
  accentClass: string; // CSS identifier
  badgeClass: string;
  borderClass: string;
  icon: string;
  kanji?: string;
  quote: string;
}

export const DISCIPLINES_MAP: Record<DisciplineId, DisciplineInfo> = {
  karate: {
    id: 'karate',
    name: 'Karate-Do',
    shortName: 'Karate',
    tagline: 'El camino de la mano vacía',
    description: 'Golpes percusivos, katas milenarios, control de distancia y disciplina mental forjada en la tradición de Okinawa.',
    origin: 'Okinawa, Japón',
    accentColor: '#ef4444',
    accentClass: 'discipline-karate',
    badgeClass: 'badge-karate',
    borderClass: 'border-karate',
    icon: '🥋',
    kanji: '空手道',
    quote: 'El Karate comienza y termina con respeto (Rei).'
  },
  bjj: {
    id: 'bjj',
    name: 'Brazilian Jiu-Jitsu',
    shortName: 'BJJ',
    tagline: 'El arte suave y el dominio del suelo',
    description: 'Sumisiones, estrangulaciones, palancas y control posicional donde la técnica y el apalancamiento vencen a la fuerza bruta.',
    origin: 'Brasil / Japón',
    accentColor: '#3b82f6',
    accentClass: 'discipline-bjj',
    badgeClass: 'badge-bjj',
    borderClass: 'border-bjj',
    icon: '🤼',
    kanji: '柔術',
    quote: 'El suelo es mi océano y yo soy un tiburón.'
  },
  'muay-thai': {
    id: 'muay-thai',
    name: 'Muay Thai',
    shortName: 'Muay Thai',
    tagline: 'El arte de las ocho extremidades',
    description: 'Uso demoledor de puños, codos, rodillas, tibias y clinch, forjado en los campos de batalla del antiguo Reino de Siam.',
    origin: 'Tailandia',
    accentColor: '#f59e0b',
    accentClass: 'discipline-muay-thai',
    badgeClass: 'badge-muay-thai',
    borderClass: 'border-muay-thai',
    icon: '🥊',
    kanji: 'มวยไทย',
    quote: 'El dolor es solo debilidad abandonando el cuerpo.'
  },
  boxeo: {
    id: 'boxeo',
    name: 'Boxeo Clásico',
    shortName: 'Boxeo',
    tagline: 'La dulce ciencia del pugilismo',
    description: 'Precisión geométrica, juego de pies elusivo, cabeceo, timing defensivo y potencia concentrada en la pegada.',
    origin: 'Inglaterra / Grecia clásica',
    accentColor: '#f43f5e',
    accentClass: 'discipline-boxeo',
    badgeClass: 'badge-boxeo',
    borderClass: 'border-boxeo',
    icon: '⚡',
    kanji: '拳闘',
    quote: 'Vuela como mariposa, pica como avispa.'
  },
  mma: {
    id: 'mma',
    name: 'Artes Marciales Mixtas (MMA)',
    shortName: 'MMA',
    tagline: 'La síntesis total del combate moderno',
    description: 'Integración sinérgica de striking multidimensional, derribos de lucha olímpica y sumisiones dentro del octágono.',
    origin: 'Global / Vale Tudo',
    accentColor: '#10b981',
    accentClass: 'discipline-mma',
    badgeClass: 'badge-mma',
    borderClass: 'border-mma',
    icon: '⚔️',
    kanji: '総合格闘技',
    quote: 'La adaptación continua es la ley suprema del combate.'
  },
};

export const DISCIPLINES_LIST = Object.values(DISCIPLINES_MAP);

export function getDiscipline(id: string): DisciplineInfo | undefined {
  return DISCIPLINES_MAP[id as DisciplineId];
}
