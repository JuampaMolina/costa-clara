import { describe, expect, it } from 'vitest';
import { BEACHES } from '../data/beaches';
import { Beach } from '../models/beach';
import {
  BeachFilters,
  compareIdsToParam,
  countByAccessibility,
  countByIsland,
  countByQuality,
  countByService,
  filterBeaches,
  getAvailableAccessibilityLevels,
  getAvailableServices,
  getBeachAccessibility,
  normalizeText,
  parseAccessibilityParam,
  parseCompareIds,
  parseServicesParam,
  parseSortParam,
  servicesToParam,
  sortBeaches,
} from './beach-filter';

const baseFilters: BeachFilters = {
  query: '',
  island: 'todas',
  quality: 'todas',
  blueFlag: false,
  services: [],
  accessibility: 'todas',
};

describe('normalizeText', () => {
  it('removes accents, lowercases and normalizes punctuation and apostrophes', () => {
    expect(normalizeText("Cala d'Hort")).toBe('cala d hort');
    expect(normalizeText('Fòrmentera')).toBe('formentera');
    expect(normalizeText('Platja d’en Bossa')).toBe('platja d en bossa');
  });
});

describe('filterBeaches (CC-24 & CC-25)', () => {
  it('returns all beaches sorted by name when there are no filters', () => {
    const result = filterBeaches(BEACHES, baseFilters);

    expect(result).toHaveLength(BEACHES.length);
    expect(result.map((beach) => beach.name)).toEqual(
      [...result.map((beach) => beach.name)].sort((a, b) => a.localeCompare(b, 'es')),
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

  it('treats formentera, Formentera and fòrmentera identically via island haystack', () => {
    const lower = filterBeaches(BEACHES, { ...baseFilters, query: 'formentera' });
    const capitalized = filterBeaches(BEACHES, { ...baseFilters, query: 'Formentera' });
    const accented = filterBeaches(BEACHES, { ...baseFilters, query: 'fòrmentera' });

    expect(lower.map((b) => b.id)).toEqual(['cala-saona', 'platja-de-migjorn', 'ses-illetes']);
    expect(capitalized.map((b) => b.id)).toEqual(lower.map((b) => b.id));
    expect(accented.map((b) => b.id)).toEqual(lower.map((b) => b.id));
  });

  it('finds all beaches of an island when searching by island name', () => {
    const mallorca = filterBeaches(BEACHES, { ...baseFilters, query: 'mallorca' });
    const menorca = filterBeaches(BEACHES, { ...baseFilters, query: 'menorca' });
    const ibiza = filterBeaches(BEACHES, { ...baseFilters, query: 'ibiza' });

    expect(mallorca).toHaveLength(BEACHES.filter((b) => b.island === 'mallorca').length);
    expect(menorca).toHaveLength(BEACHES.filter((b) => b.island === 'menorca').length);
    expect(ibiza).toHaveLength(BEACHES.filter((b) => b.island === 'ibiza').length);
  });

  it("supports apostrophes with and without spaces (d'Hort / dhort)", () => {
    const withApostrophe = filterBeaches(BEACHES, { ...baseFilters, query: "cala d'hort" });
    const withoutApostrophe = filterBeaches(BEACHES, { ...baseFilters, query: 'cala dhort' });
    const denBossa = filterBeaches(BEACHES, { ...baseFilters, query: 'platja den bossa' });

    expect(withApostrophe.map((b) => b.id)).toEqual(['cala-dhort']);
    expect(withoutApostrophe.map((b) => b.id)).toEqual(['cala-dhort']);
    expect(denBossa.map((b) => b.id)).toEqual(['platja-den-bossa']);
  });

  it('supports Balearic synonyms (playa/platja/cala, parking/aparcamiento, aseos/wc)', () => {
    const playaPalma = filterBeaches(BEACHES, { ...baseFilters, query: 'playa de palma' });
    const playaMondrago = filterBeaches(BEACHES, { ...baseFilters, query: 'playa mondrago' });
    const parkingMallorca = filterBeaches(BEACHES, { ...baseFilters, query: 'parking mallorca' });
    const wc = filterBeaches(BEACHES, { ...baseFilters, query: 'wc' });
    const salvamento = filterBeaches(BEACHES, { ...baseFilters, query: 'salvamento' });
    const pmr = filterBeaches(BEACHES, { ...baseFilters, query: 'pmr' });

    expect(playaPalma.map((b) => b.id)).toContain('platja-de-palma');
    expect(playaMondrago.map((b) => b.id)).toEqual(['cala-mondrago']);
    expect(parkingMallorca.map((b) => b.id)).toEqual(['es-trenc', 'platja-de-palma']);
    expect(wc).toHaveLength(BEACHES.filter((b) => b.services.includes('Aseos')).length);
    expect(salvamento).toHaveLength(
      BEACHES.filter((b) => b.services.includes('Socorrista')).length,
    );
    expect(pmr).toHaveLength(BEACHES.filter((b) => b.services.includes('Acceso adaptado')).length);
  });

  it('preserves es/sa/ses articles for Balearic beach names', () => {
    expect(filterBeaches(BEACHES, { ...baseFilters, query: 'es trenc' }).map((b) => b.id)).toEqual([
      'es-trenc',
    ]);
    expect(
      filterBeaches(BEACHES, { ...baseFilters, query: 'sa calobra' }).map((b) => b.id),
    ).toEqual(['sa-calobra']);
    expect(
      filterBeaches(BEACHES, { ...baseFilters, query: 'ses illetes' }).map((b) => b.id),
    ).toEqual(['ses-illetes']);
  });

  it('searches in municipality and services', () => {
    const byMunicipality = filterBeaches(BEACHES, { ...baseFilters, query: 'santanyi' });
    const byService = filterBeaches(BEACHES, { ...baseFilters, query: 'socorrista' });

    expect(byMunicipality.map((beach) => beach.id)).toContain('cala-mondrago');
    expect(byService.length).toBeGreaterThan(0);
  });

  it('applies AND semantics for selected services', () => {
    const result = filterBeaches(BEACHES, {
      ...baseFilters,
      services: ['Aparcamiento', 'Acceso adaptado'],
    });

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (beach) =>
          beach.services.includes('Aparcamiento') && beach.services.includes('Acceso adaptado'),
      ),
    ).toBe(true);
  });

  it('filters by derived and explicit accessibility', () => {
    const adapted = filterBeaches(BEACHES, { ...baseFilters, accessibility: 'adaptada' });
    expect(adapted).toHaveLength(5);
    expect(adapted.every((beach) => getBeachAccessibility(beach) === 'adaptada')).toBe(true);

    const partialBeach: Beach = {
      ...BEACHES[0],
      id: 'cala-parcial',
      accessibility: 'parcial',
      services: [],
    };
    const partial = filterBeaches([...BEACHES, partialBeach], {
      ...baseFilters,
      accessibility: 'parcial',
    });
    expect(partial.map((b) => b.id)).toEqual(['cala-parcial']);
  });

  it('returns an empty list when nothing matches', () => {
    const result = filterBeaches(BEACHES, { ...baseFilters, query: 'playa inexistente' });

    expect(result).toEqual([]);
  });
});

describe('sortBeaches (CC-23)', () => {
  it('sorts by name, quality, latest sample, island and distance', () => {
    const byQuality = sortBeaches(BEACHES, 'calidad');
    expect(byQuality[0].quality).toBe('excelente');
    expect(byQuality[byQuality.length - 1].quality).toBe('suficiente');

    const bySample = sortBeaches(BEACHES, 'muestra');
    expect(bySample[0].lastSample).toBe('2026-09-15');
    expect(bySample[bySample.length - 1].lastSample).toBe('2026-09-01');

    const byIsland = sortBeaches(BEACHES, 'isla');
    expect(byIsland[0].island).toBe('formentera');
    expect(byIsland[byIsland.length - 1].island).toBe('menorca');

    const byDistance = sortBeaches(BEACHES, 'distancia', { lat: 39.512, lon: 2.752 });
    expect(byDistance[0].id).toBe('platja-de-palma');
  });

  it('falls back to name sorting when distance is requested without user location', () => {
    const byDistance = sortBeaches(BEACHES, 'distancia', null);
    const byName = sortBeaches(BEACHES, 'nombre');
    expect(byDistance.map((b) => b.id)).toEqual(byName.map((b) => b.id));
  });

  it('places empty lastSample dates at the end when sorting by muestra', () => {
    const withoutDate: Beach = {
      ...BEACHES[0],
      id: 'sin-fecha',
      name: 'A Sin Fecha',
      lastSample: '',
    };
    const sorted = sortBeaches([withoutDate, BEACHES[0]], 'muestra');
    expect(sorted[sorted.length - 1].id).toBe('sin-fecha');
  });

  it('parses valid URL sort parameters and falls back to nombre', () => {
    expect(parseSortParam('calidad')).toBe('calidad');
    expect(parseSortParam('muestra')).toBe('muestra');
    expect(parseSortParam('isla')).toBe('isla');
    expect(parseSortParam('distancia')).toBe('nombre');
    expect(parseSortParam('desconocido')).toBe('nombre');
    expect(parseSortParam(null)).toBe('nombre');
  });
});

describe('cross-filter facet counts (CC-23 & CC-25)', () => {
  it('countByIsland ignores active island filter while respecting other filters', () => {
    const counts = countByIsland(BEACHES, {
      ...baseFilters,
      island: 'menorca',
      quality: 'excelente',
    });

    const totalExcelente = BEACHES.filter((b) => b.quality === 'excelente').length;
    expect(counts.todas).toBe(totalExcelente);
    expect(counts.menorca).toBe(2);
    expect(counts.mallorca).toBe(4);
    expect(counts.ibiza).toBe(2);
    expect(counts.formentera).toBe(2);
  });

  it('countByQuality ignores active quality filter while respecting island filter', () => {
    const counts = countByQuality(BEACHES, {
      ...baseFilters,
      island: 'menorca',
      quality: 'excelente',
    });

    expect(counts.todas).toBe(4);
    expect(counts.excelente).toBe(2);
    expect(counts.buena).toBe(1);
    expect(counts.suficiente).toBe(1);
    expect(counts.insuficiente).toBe(0);
  });

  it('derives services, accessibility levels, URL slugs and contextual counts from dataset', () => {
    const services = getAvailableServices(BEACHES);
    expect(services).toEqual([
      'Socorrista',
      'Aseos',
      'Duchas',
      'Aparcamiento',
      'Acceso adaptado',
      'Chiringuito',
    ]);

    expect(getAvailableAccessibilityLevels(BEACHES)).toEqual(['todas', 'adaptada']);

    const withPartial: Beach[] = [...BEACHES, { ...BEACHES[0], id: 'p', accessibility: 'parcial' }];
    expect(getAvailableAccessibilityLevels(withPartial)).toEqual(['todas', 'adaptada', 'parcial']);

    expect(servicesToParam(['Socorrista', 'Aparcamiento'])).toBe('aparcamiento,socorrista');
    expect(servicesToParam([])).toBeNull();
    expect(parseServicesParam('socorrista,invalido,aparcamiento,socorrista', services)).toEqual([
      'Socorrista',
      'Aparcamiento',
    ]);
    expect(parseAccessibilityParam('adaptada', ['todas', 'adaptada'])).toBe('adaptada');
    expect(parseAccessibilityParam('parcial', ['todas', 'adaptada'])).toBe('todas');

    const serviceCounts = countByService(
      BEACHES,
      { ...baseFilters, island: 'formentera' },
      services,
    );
    expect(serviceCounts['Socorrista']).toBe(3);
    expect(serviceCounts['Aparcamiento']).toBe(1);
    expect(serviceCounts['Acceso adaptado']).toBe(0);

    const accCounts = countByAccessibility(BEACHES, {
      ...baseFilters,
      island: 'mallorca',
      accessibility: 'adaptada',
    });
    expect(accCounts.todas).toBe(8);
    expect(accCounts.adaptada).toBe(3);
  });
});

describe('parseCompareIds (CC-21)', () => {
  const validIds = new Set(BEACHES.map((b) => b.id));

  it('parses up to 3 unique valid beach ids in order and drops invalid entries', () => {
    expect(
      parseCompareIds('es-trenc,cala-macarella,ses-illetes,son-bou,inexistente', validIds),
    ).toEqual(['es-trenc', 'cala-macarella', 'ses-illetes']);

    expect(parseCompareIds('es-trenc,es-trenc, ,cala-macarella', validIds)).toEqual([
      'es-trenc',
      'cala-macarella',
    ]);

    expect(parseCompareIds('no-existe', validIds)).toEqual([]);
    expect(parseCompareIds(null, validIds)).toEqual([]);
  });

  it('serializes compare ids to URL param', () => {
    expect(compareIdsToParam([])).toBeNull();
    expect(compareIdsToParam(['es-trenc', 'cala-macarella'])).toBe('es-trenc,cala-macarella');
  });
});
