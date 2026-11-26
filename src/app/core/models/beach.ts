export type IslandId = 'mallorca' | 'menorca' | 'ibiza' | 'formentera';

export type WaterQuality = 'excelente' | 'buena' | 'suficiente' | 'insuficiente' | 'sin-datos';

export interface Beach {
  id: string;
  name: string;
  municipality: string;
  island: IslandId;
  lon: number;
  lat: number;
  quality: WaterQuality;
  blueFlag: boolean;
  services: string[];
  description: string;
  lastSample: string;
}

export const ISLANDS: ReadonlyArray<{ id: IslandId; label: string }> = [
  { id: 'mallorca', label: 'Mallorca' },
  { id: 'menorca', label: 'Menorca' },
  { id: 'ibiza', label: 'Ibiza' },
  { id: 'formentera', label: 'Formentera' },
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
