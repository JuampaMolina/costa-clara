import {
  Accessibility,
  Beach,
  ISLANDS,
  IslandId,
  QUALITY_LABELS,
  QUALITY_RANK,
  SERVICES,
  ServiceId,
  WaterQuality,
} from '../models/beach';
import { Coordinates, distanceKm } from './geo';

export type BeachSort = 'nombre' | 'calidad' | 'muestra' | 'isla' | 'distancia';
export type AccessibilityFilter = Exclude<Accessibility, 'sin-datos'> | 'todas';

export interface BeachFilters {
  query: string;
  island: IslandId | 'todas';
  quality: WaterQuality | 'todas';
  blueFlag: boolean;
  services?: readonly ServiceId[];
  accessibility?: AccessibilityFilter;
}

export const MAX_COMPARE_BEACHES = 3;

export const ACCESSIBILITY_LABELS: Record<Accessibility | 'todas', string> = {
  todas: 'Todas',
  adaptada: 'Adaptada',
  parcial: 'Parcial',
  'sin-datos': 'Sin datos',
};

export const SERVICE_SLUGS: Record<ServiceId, string> = {
  Socorrista: 'socorrista',
  Aseos: 'aseos',
  Duchas: 'duchas',
  Aparcamiento: 'aparcamiento',
  'Acceso adaptado': 'acceso-adaptado',
  Chiringuito: 'chiringuito',
};

const SLUG_TO_SERVICE = new Map<string, ServiceId>(
  (Object.entries(SERVICE_SLUGS) as [ServiceId, string][]).map(([service, slug]) => [
    slug,
    service,
  ]),
);

const ISLAND_LABELS = new Map<IslandId, string>(ISLANDS.map((island) => [island.id, island.label]));
const SERVICE_ORDER = new Map<ServiceId, number>(
  SERVICES.map((service, index) => [service.id, index]),
);
const URL_SORT_VALUES = new Set<BeachSort>(['nombre', 'calidad', 'muestra', 'isla']);
const QUALITY_KEYS = Object.keys(QUALITY_LABELS) as WaterQuality[];

const STOP_WORDS = new Set(['de', 'la', 'el', 'd', 'en']);

const SEARCH_SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['playa', 'playas', 'platja', 'platges', 'cala', 'calas', 'cales'],
  ['aparcamiento', 'aparcamientos', 'parking'],
  ['aseos', 'aseo', 'bano', 'banos', 'wc'],
  ['socorrista', 'socorristas', 'salvamento'],
  ['adaptado', 'adaptada', 'adaptados', 'adaptadas', 'accesible', 'accesibles', 'pmr'],
];

const SYNONYM_MAP = new Map<string, readonly string[]>();
for (const group of SEARCH_SYNONYM_GROUPS) {
  for (const term of group) {
    SYNONYM_MAP.set(term, group);
  }
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`·\-_/.,;:()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeQuery(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length <= 1) return tokens;

  const filtered = tokens.filter((token) => !STOP_WORDS.has(token));
  return filtered.length > 0 ? filtered : tokens;
}

export function getBeachAccessibility(beach: Beach): Accessibility {
  return (
    beach.accessibility ?? (beach.services.includes('Acceso adaptado') ? 'adaptada' : 'sin-datos')
  );
}

export function getAvailableServices(beaches: readonly Beach[]): ServiceId[] {
  const present = new Set<ServiceId>();
  for (const beach of beaches) {
    for (const service of beach.services) {
      present.add(service);
    }
  }

  return [...present].sort((a, b) => {
    const orderA = SERVICE_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
    const orderB = SERVICE_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB || a.localeCompare(b, 'es');
  });
}

export function getAvailableAccessibilityLevels(beaches: readonly Beach[]): AccessibilityFilter[] {
  const present = new Set<Accessibility>();
  for (const beach of beaches) {
    present.add(getBeachAccessibility(beach));
  }

  const levels: AccessibilityFilter[] = ['todas'];
  if (present.has('adaptada')) levels.push('adaptada');
  if (present.has('parcial')) levels.push('parcial');
  return levels;
}

export function servicesToParam(services: readonly ServiceId[]): string | null {
  if (services.length === 0) return null;

  const slugs = [...new Set(services.map((service) => SERVICE_SLUGS[service]).filter(Boolean))];
  if (slugs.length === 0) return null;

  return slugs.sort((a, b) => a.localeCompare(b)).join(',');
}

export function parseServicesParam(
  raw: string | null | undefined,
  availableServices: readonly ServiceId[],
): ServiceId[] {
  if (!raw) return [];

  const allowed = new Set<ServiceId>(availableServices);
  const selected = new Set<ServiceId>();

  for (const part of raw.split(',')) {
    const slug = part.trim().toLowerCase();
    if (!slug) continue;

    const service = SLUG_TO_SERVICE.get(slug);
    if (service && allowed.has(service)) {
      selected.add(service);
    }
  }

  return availableServices.filter((service) => selected.has(service));
}

export function parseAccessibilityParam(
  raw: string | null | undefined,
  availableLevels: readonly AccessibilityFilter[],
): AccessibilityFilter {
  if (!raw) return 'todas';

  const normalized = raw.trim().toLowerCase();
  if (
    (normalized === 'adaptada' || normalized === 'parcial') &&
    availableLevels.includes(normalized)
  ) {
    return normalized;
  }

  return 'todas';
}

export function parseSortParam(raw: string | null | undefined): BeachSort {
  if (!raw) return 'nombre';

  const normalized = raw.trim().toLowerCase() as BeachSort;
  return URL_SORT_VALUES.has(normalized) ? normalized : 'nombre';
}

export function parseCompareIds(
  raw: string | null | undefined,
  validIds: ReadonlySet<string> | readonly string[],
): string[] {
  if (!raw) return [];

  const allowed = validIds instanceof Set ? validIds : new Set(validIds);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const part of raw.split(',')) {
    const id = part.trim();
    if (!id || seen.has(id) || !allowed.has(id)) continue;

    seen.add(id);
    result.push(id);
    if (result.length >= MAX_COMPARE_BEACHES) break;
  }

  return result;
}

export function compareIdsToParam(ids: readonly string[]): string | null {
  return ids.length > 0 ? ids.slice(0, MAX_COMPARE_BEACHES).join(',') : null;
}

function buildSearchHaystack(beach: Beach): { text: string; words: Set<string> } {
  const compactName = beach.name.replace(/['’]/g, '');
  const islandLabel = ISLAND_LABELS.get(beach.island) ?? beach.island;
  const accessibility = getBeachAccessibility(beach);
  const parts = [
    beach.name,
    compactName,
    beach.municipality,
    islandLabel,
    beach.description,
    ...beach.services,
    accessibility !== 'sin-datos' ? accessibility : '',
  ];

  const text = normalizeText(parts.join(' '));
  return {
    text,
    words: new Set(text.split(' ').filter(Boolean)),
  };
}

function matchesQuery(beach: Beach, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;

  const { text, words } = buildSearchHaystack(beach);

  return tokens.every((token) => {
    const synonyms = SYNONYM_MAP.get(token);
    if (synonyms) {
      return synonyms.some((term) => words.has(term));
    }

    return text.includes(token);
  });
}

export function filterBeaches(beaches: readonly Beach[], filters: BeachFilters): Beach[] {
  const tokens = tokenizeQuery(filters.query);
  const requiredServices = filters.services ?? [];
  const accessibility = filters.accessibility ?? 'todas';

  return beaches
    .filter((beach) => {
      if (filters.island !== 'todas' && beach.island !== filters.island) return false;
      if (filters.quality !== 'todas' && beach.quality !== filters.quality) return false;
      if (filters.blueFlag && !beach.blueFlag) return false;
      if (
        requiredServices.length > 0 &&
        !requiredServices.every((service) => beach.services.includes(service))
      ) {
        return false;
      }
      if (accessibility !== 'todas' && getBeachAccessibility(beach) !== accessibility) {
        return false;
      }

      return matchesQuery(beach, tokens);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function sortBeaches(
  beaches: readonly Beach[],
  sortBy: BeachSort,
  userLocation: Coordinates | null = null,
): Beach[] {
  const copy = [...beaches];

  switch (sortBy) {
    case 'calidad':
      return copy.sort(
        (a, b) =>
          QUALITY_RANK[b.quality] - QUALITY_RANK[a.quality] || a.name.localeCompare(b.name, 'es'),
      );
    case 'muestra':
      return copy.sort((a, b) => {
        if (!a.lastSample && !b.lastSample) return a.name.localeCompare(b.name, 'es');
        if (!a.lastSample) return 1;
        if (!b.lastSample) return -1;
        return b.lastSample.localeCompare(a.lastSample) || a.name.localeCompare(b.name, 'es');
      });
    case 'isla':
      return copy.sort((a, b) => {
        const labelA = ISLAND_LABELS.get(a.island) ?? a.island;
        const labelB = ISLAND_LABELS.get(b.island) ?? b.island;
        return labelA.localeCompare(labelB, 'es') || a.name.localeCompare(b.name, 'es');
      });
    case 'distancia':
      if (userLocation) {
        return copy.sort(
          (a, b) =>
            distanceKm(userLocation, a) - distanceKm(userLocation, b) ||
            a.name.localeCompare(b.name, 'es'),
        );
      }
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    case 'nombre':
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}

export function countByIsland(
  beaches: readonly Beach[],
  filters?: BeachFilters,
): Record<IslandId | 'todas', number> {
  const scoped = filters ? filterBeaches(beaches, { ...filters, island: 'todas' }) : beaches;
  const counts: Record<IslandId | 'todas', number> = {
    todas: scoped.length,
    mallorca: 0,
    menorca: 0,
    ibiza: 0,
    formentera: 0,
  };

  for (const beach of scoped) {
    counts[beach.island] += 1;
  }

  return counts;
}

export function countByQuality(
  beaches: readonly Beach[],
  filters?: BeachFilters,
): Record<WaterQuality | 'todas', number> {
  const scoped = filters ? filterBeaches(beaches, { ...filters, quality: 'todas' }) : beaches;
  const counts: Record<WaterQuality | 'todas', number> = {
    todas: scoped.length,
    excelente: 0,
    buena: 0,
    suficiente: 0,
    insuficiente: 0,
    'sin-datos': 0,
  };

  for (const beach of scoped) {
    if (QUALITY_KEYS.includes(beach.quality)) {
      counts[beach.quality] += 1;
    }
  }

  return counts;
}

export function countByService(
  beaches: readonly Beach[],
  filters: BeachFilters,
  availableServices: readonly ServiceId[],
): Record<ServiceId, number> {
  const scoped = filterBeaches(beaches, filters);
  const counts = {} as Record<ServiceId, number>;

  for (const service of availableServices) {
    counts[service] = 0;
  }

  for (const beach of scoped) {
    for (const service of availableServices) {
      if (beach.services.includes(service)) {
        counts[service] += 1;
      }
    }
  }

  return counts;
}

export function countByAccessibility(
  beaches: readonly Beach[],
  filters?: BeachFilters,
): Record<AccessibilityFilter, number> {
  const scoped = filters ? filterBeaches(beaches, { ...filters, accessibility: 'todas' }) : beaches;
  const counts: Record<AccessibilityFilter, number> = {
    todas: scoped.length,
    adaptada: 0,
    parcial: 0,
  };

  for (const beach of scoped) {
    const level = getBeachAccessibility(beach);
    if (level === 'adaptada' || level === 'parcial') {
      counts[level] += 1;
    }
  }

  return counts;
}
