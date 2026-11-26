import { describe, expect, it } from 'vitest';
import { BEACHES } from '../data/beaches';
import { filterBeaches } from './beach-filter';

const baseFilters = {
  query: '',
  island: 'todas' as const,
  quality: 'todas' as const,
  blueFlag: false,
};

describe('filterBeaches', () => {
  it('returns all beaches sorted by name when there are no filters', () => {
    const result = filterBeaches(BEACHES, baseFilters);

    expect(result).toHaveLength(BEACHES.length);
    expect(result.map((beach) => beach.name)).toEqual(
      [...result.map((beach) => beach.name)].sort((a, b) => a.localeCompare(b, 'es'))
    );
  });

  it('filters by island', () => {
    const result = filterBeaches(BEACHES, { ...baseFilters, island: 'menorca' });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((beach) => beach.island === 'menorca')).toBe(true);
  });

  it('filters by quality and blue flag', () => {
    const result = filterBeaches(BEACHES, {
      ...baseFilters,
      quality: 'excelente',
      blueFlag: true,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((beach) => beach.quality === 'excelente' && beach.blueFlag)).toBe(true);
  });

  it('ignores accents and case in the search query', () => {
    const result = filterBeaches(BEACHES, { ...baseFilters, query: 'MONDRAGO' });

    expect(result.map((beach) => beach.id)).toContain('cala-mondrago');
  });

  it('searches in municipality and services', () => {
    const byMunicipality = filterBeaches(BEACHES, { ...baseFilters, query: 'santanyi' });
    const byService = filterBeaches(BEACHES, { ...baseFilters, query: 'socorrista' });

    expect(byMunicipality.map((beach) => beach.id)).toContain('cala-mondrago');
    expect(byService.length).toBeGreaterThan(0);
  });

  it('returns an empty list when nothing matches', () => {
    const result = filterBeaches(BEACHES, { ...baseFilters, query: 'playa inexistente' });

    expect(result).toEqual([]);
  });
});
