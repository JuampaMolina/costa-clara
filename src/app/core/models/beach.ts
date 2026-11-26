export type IslandId = 'mallorca' | 'menorca' | 'ibiza' | 'formentera';

export type WaterQuality = 'excelente' | 'buena' | 'suficiente' | 'insuficiente' | 'sin-datos';

export type ServiceId =
  | 'Socorrista'
  | 'Aseos'
  | 'Duchas'
  | 'Aparcamiento'
  | 'Acceso adaptado'
  | 'Chiringuito';

export type Accessibility = 'adaptada' | 'parcial' | 'sin-datos';

export interface BeachSample {
  date: string;
  quality: WaterQuality;
  source?: string;
}

export interface DataSource {
  name: string;
  url: string;
  license: string;
}

export interface Beach {
  id: string;
  name: string;
  municipality: string;
  island: IslandId;
  lon: number;
  lat: number;
  quality: WaterQuality;
  blueFlag: boolean;
  blueFlagYear?: number;
  services: ServiceId[];
  accessibility?: Accessibility;
  description: string;
  lastSample: string;
  samples?: BeachSample[];
  source?: DataSource;
  updatedAt?: string;
  dataStatus?: 'demo' | 'real';
}

export const ISLANDS: ReadonlyArray<{ id: IslandId; label: string }> = [
  { id: 'mallorca', label: 'Mallorca' },
  { id: 'menorca', label: 'Menorca' },
  { id: 'ibiza', label: 'Ibiza' },
  { id: 'formentera', label: 'Formentera' },
];

export const SERVICES: ReadonlyArray<{ id: ServiceId; label: string }> = [
  { id: 'Socorrista', label: 'Socorrista' },
  { id: 'Aseos', label: 'Aseos' },
  { id: 'Duchas', label: 'Duchas' },
  { id: 'Aparcamiento', label: 'Aparcamiento' },
  { id: 'Acceso adaptado', label: 'Acceso adaptado' },
  { id: 'Chiringuito', label: 'Chiringuito' },
];

export const QUALITY_LABELS: Record<WaterQuality, string> = {
  excelente: 'Excelente',
  buena: 'Buena',
  suficiente: 'Suficiente',
  insuficiente: 'Insuficiente',
  'sin-datos': 'Sin datos',
};

export const QUALITY_COLORS: Record<WaterQuality, string> = {
  excelente: '#0f9f6e',
  buena: '#65a30d',
  suficiente: '#d97706',
  insuficiente: '#dc2626',
  'sin-datos': '#64748b',
};

export const QUALITY_RANK: Record<WaterQuality, number> = {
  excelente: 4,
  buena: 3,
  suficiente: 2,
  insuficiente: 1,
  'sin-datos': 0,
};
