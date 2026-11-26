import { Beach, IslandId, WaterQuality } from '../models/beach';

export interface BeachFilters {
  query: string;
  island: IslandId | 'todas';
  quality: WaterQuality | 'todas';
  blueFlag: boolean;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterBeaches(beaches: Beach[], filters: BeachFilters): Beach[] {
  const query = normalizeText(filters.query);

  return beaches
    .filter((beach) => {
      if (filters.island !== 'todas' && beach.island !== filters.island) return false;
      if (filters.quality !== 'todas' && beach.quality !== filters.quality) return false;
      if (filters.blueFlag && !beach.blueFlag) return false;
      if (!query) return true;

      const haystack = normalizeText(
        [beach.name, beach.municipality, beach.description, ...beach.services].join(' ')
      );
      return haystack.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
