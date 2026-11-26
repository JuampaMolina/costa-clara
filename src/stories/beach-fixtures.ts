import { computed, signal } from '@angular/core';
import { Beach, BeachSample } from '../app/core/models/beach';
import { AnalyticsService } from '../app/core/services/analytics';
import { FavoritesStore } from '../app/core/services/favorites';
import {
  MARINE_SOURCE,
  MarineWeather,
  MarineWeatherResult,
  MarineWeatherService,
} from '../app/core/services/marine-weather';
import { Coordinates } from '../app/core/utils/geo';

export const MOCK_SAMPLES_IMPROVING: BeachSample[] = [
  { date: '2026-05-18', quality: 'buena' },
  { date: '2026-06-15', quality: 'excelente' },
  { date: '2026-07-20', quality: 'excelente' },
  { date: '2026-08-17', quality: 'buena' },
  { date: '2026-09-14', quality: 'excelente' },
];

export const MOCK_SAMPLES_DECLINING: BeachSample[] = [
  { date: '2026-06-10', quality: 'excelente' },
  { date: '2026-07-12', quality: 'excelente' },
  { date: '2026-08-14', quality: 'buena' },
  { date: '2026-09-10', quality: 'suficiente' },
];

export const MOCK_SAMPLES_STABLE: BeachSample[] = [
  { date: '2026-07-05', quality: 'excelente' },
  { date: '2026-08-09', quality: 'excelente' },
  { date: '2026-09-12', quality: 'excelente' },
];

export const MOCK_SAMPLES_SINGLE: BeachSample[] = [{ date: '2026-09-14', quality: 'excelente' }];

const OFFICIAL_SOURCE = {
  name: 'NAYADE (Ministerio de Sanidad)',
  url: 'https://nayade.sanidad.gob.es/',
  license: 'Reutilización de información del sector público (Ley 37/2007)',
};

export const MOCK_BEACH_ES_TRENC: Beach = {
  id: 'es-trenc',
  name: 'Es Trenc',
  municipality: 'Campos',
  island: 'mallorca',
  lon: 2.9828,
  lat: 39.3406,
  quality: 'excelente',
  blueFlag: true,
  blueFlagYear: 2026,
  services: ['Socorrista', 'Aseos', 'Duchas', 'Aparcamiento'],
  accessibility: 'parcial',
  description:
    'Arena blanca y aguas turquesas. Uno de los arenales más largos y conocidos de Mallorca, con zonas nudistas y dunas protegidas.',
  lastSample: '2026-09-14',
  samples: MOCK_SAMPLES_IMPROVING,
  source: OFFICIAL_SOURCE,
  updatedAt: '2026-09-15',
  dataStatus: 'real',
};

export const MOCK_BEACH_CALA_MONDRAGO: Beach = {
  id: 'cala-mondrago',
  name: 'Cala Mondragó',
  municipality: 'Santanyí',
  island: 'mallorca',
  lon: 3.1845,
  lat: 39.3516,
  quality: 'excelente',
  blueFlag: true,
  blueFlagYear: 2026,
  services: ['Socorrista', 'Aseos', 'Duchas', 'Acceso adaptado'],
  accessibility: 'adaptada',
  description:
    'Cala resguardada dentro del Parc Natural de Mondragó, ideal para familias y para combinar con rutas de senderismo.',
  lastSample: '2026-09-12',
  samples: MOCK_SAMPLES_STABLE,
  source: OFFICIAL_SOURCE,
  updatedAt: '2026-09-15',
  dataStatus: 'real',
};

export const MOCK_BEACH_CALA_MILLOR: Beach = {
  id: 'cala-millor',
  name: 'Cala Millor',
  municipality: 'Sant Llorenç des Cardassar',
  island: 'mallorca',
  lon: 3.3834,
  lat: 39.6011,
  quality: 'buena',
  blueFlag: true,
  blueFlagYear: 2026,
  services: ['Socorrista', 'Aseos', 'Duchas', 'Acceso adaptado', 'Chiringuito'],
  accessibility: 'adaptada',
  description:
    'Playa urbana de arena fina con paseo marítimo, alquiler de hamacas y una amplia oferta de restauración.',
  lastSample: '2026-09-10',
  samples: MOCK_SAMPLES_DECLINING,
  source: OFFICIAL_SOURCE,
  updatedAt: '2026-09-15',
  dataStatus: 'real',
};

export const MOCK_BEACH_CALA_VARQUES: Beach = {
  id: 'cala-varques',
  name: 'Cala Varques',
  municipality: 'Manacor',
  island: 'mallorca',
  lon: 3.283,
  lat: 39.497,
  quality: 'excelente',
  blueFlag: false,
  services: [],
  accessibility: 'sin-datos',
  description:
    'Cala virgen de acceso a pie, muy apreciada por quienes buscan naturaleza y pocos servicios. Lleva agua y calzado cómodo.',
  lastSample: '2026-09-05',
  dataStatus: 'demo',
};

export const MOCK_BEACH_CALA_TURQUETA: Beach = {
  id: 'cala-turqueta',
  name: 'Cala en Turqueta',
  municipality: 'Ciutadella de Menorca',
  island: 'menorca',
  lon: 3.9145,
  lat: 39.9316,
  quality: 'excelente',
  blueFlag: false,
  services: [],
  accessibility: 'sin-datos',
  description:
    'Cala virgen rodeada de pinar en el sur de Menorca, con aguas claras y fondo arenoso.',
  lastSample: '2026-09-11',
  samples: MOCK_SAMPLES_SINGLE,
  dataStatus: 'real',
};

export const MOCK_BEACH_CALA_COMTE: Beach = {
  id: 'cala-comte',
  name: 'Platges de Comte',
  municipality: 'Sant Josep de sa Talaia',
  island: 'ibiza',
  lon: 1.2202,
  lat: 38.9631,
  quality: 'buena',
  blueFlag: true,
  blueFlagYear: 2026,
  services: ['Socorrista', 'Aseos', 'Chiringuito'],
  accessibility: 'parcial',
  description:
    'Conjunto de calas orientadas al oeste con vistas a los islotes y aguas cristalinas.',
  lastSample: '2026-09-09',
  dataStatus: 'real',
};

export const MOCK_BEACH_SES_ILLETES: Beach = {
  id: 'ses-illetes',
  name: 'Ses Illetes',
  municipality: 'Formentera',
  island: 'formentera',
  lon: 1.4342,
  lat: 38.7589,
  quality: 'excelente',
  blueFlag: true,
  blueFlagYear: 2026,
  services: ['Socorrista', 'Chiringuito', 'Aparcamiento'],
  accessibility: 'parcial',
  description: 'Lengua de arena clara en el Parc Natural de ses Salines con aguas poco profundas.',
  lastSample: '2026-09-14',
  dataStatus: 'real',
};

export const MOCK_MAP_BEACHES: Beach[] = [
  MOCK_BEACH_ES_TRENC,
  MOCK_BEACH_CALA_MONDRAGO,
  MOCK_BEACH_CALA_MILLOR,
  MOCK_BEACH_CALA_VARQUES,
  MOCK_BEACH_CALA_TURQUETA,
  MOCK_BEACH_CALA_COMTE,
  MOCK_BEACH_SES_ILLETES,
];

export const MOCK_PALMA_LOCATION: Coordinates = {
  lat: 39.5696,
  lon: 2.6502,
};

export const MOCK_MARINE_WEATHER: MarineWeather = {
  waveHeight: 0.45,
  wavePeriod: 5.2,
  seaTemperature: 23.4,
  observedAt: '2026-09-14T11:30',
  source: MARINE_SOURCE.name,
};

export function createMockFavoritesStore(
  initialIds: string[] = [],
): Pick<FavoritesStore, 'count' | 'isFavorite' | 'toggle'> {
  const ids = signal<ReadonlySet<string>>(new Set(initialIds));

  return {
    count: computed(() => ids().size),
    isFavorite: (id: string) => ids().has(id),
    toggle: (id: string) => {
      const next = new Set(ids());
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      ids.set(next);
    },
  };
}

export function createMockMarineWeatherService(
  result: MarineWeatherResult = { status: 'ok', data: MOCK_MARINE_WEATHER },
): Pick<MarineWeatherService, 'get'> {
  return {
    get: () => Promise.resolve(result),
  };
}

export function createMockAnalyticsService(): Pick<AnalyticsService, 'track'> {
  return {
    track: () => undefined,
  };
}
