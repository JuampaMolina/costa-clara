import { describe, expect, it } from 'vitest';
import { RawRow, buildDataset } from './data-import';

const beachRow = (overrides: RawRow = {}): RawRow => ({
  id: 'es-trenc',
  name: 'Es Trenc',
  municipality: 'Campos',
  island: 'mallorca',
  lon: '2.9828',
  lat: '39.3406',
  description: 'Arena blanca y aguas turquesas.',
  services: 'Socorrista; Aseos',
  blue_flag: '1',
  blue_flag_year: '2026',
  source_name: 'Fuente de prueba',
  source_url: 'https://example.com/playas',
  source_license: 'CC-BY-4.0',
  updated_at: '2026-09-20',
  ...overrides,
});

const sample = (overrides: RawRow = {}): RawRow => ({
  beach_id: 'es-trenc',
  date: '2026-09-14',
  quality: 'excelente',
  ...overrides,
});

describe('buildDataset', () => {
  it('builds a validated beach with samples and provenance', () => {
    const [beach] = buildDataset(
      [beachRow()],
      [sample({ date: '2026-06-01', quality: 'buena' }), sample()],
    );

    expect(beach.id).toBe('es-trenc');
    expect(beach.quality).toBe('excelente');
    expect(beach.lastSample).toBe('2026-09-14');
    expect(beach.samples?.map((item) => item.date)).toEqual(['2026-06-01', '2026-09-14']);
    expect(beach.services).toEqual(['Socorrista', 'Aseos']);
    expect(beach.accessibility).toBe('sin-datos');
    expect(beach.dataStatus).toBe('real');
    expect(beach.source).toEqual({
      name: 'Fuente de prueba',
      url: 'https://example.com/playas',
      license: 'CC-BY-4.0',
    });
    expect(beach.blueFlagYear).toBe(2026);
  });

  it('derives accessibility from services and trims separators', () => {
    const [beach] = buildDataset([beachRow({ services: ' Acceso adaptado | Aseos ' })], [sample()]);

    expect(beach.services).toEqual(['Acceso adaptado', 'Aseos']);
    expect(beach.accessibility).toBe('adaptada');
  });

  it('rejects unknown islands, services, qualities and coordinates', () => {
    expect(() => buildDataset([beachRow({ island: 'canarias' })], [sample()])).toThrow(
      /island "canarias"/,
    );
    expect(() =>
      buildDataset([beachRow({ services: 'Socorrista;Helipuerto' })], [sample()]),
    ).toThrow(/servicio "Helipuerto"/);
    expect(() => buildDataset([beachRow()], [sample({ quality: 'regular' })])).toThrow(
      /quality "regular"/,
    );
    expect(() => buildDataset([beachRow({ lon: '9.9' })], [sample()])).toThrow(
      /fuera del rango de Baleares/,
    );
  });

  it('rejects duplicate beach ids', () => {
    expect(() => buildDataset([beachRow(), beachRow()], [sample()])).toThrow(/id duplicado/);
  });

  it('requires at least one sample per beach', () => {
    expect(() => buildDataset([beachRow()], [])).toThrow(/no tiene muestras/);
  });

  it('rejects samples for unknown beaches and duplicate sample dates', () => {
    expect(() => buildDataset([beachRow()], [sample({ beach_id: 'otra-playa' })])).toThrow(
      /playa inexistente "otra-playa"/,
    );
    expect(() => buildDataset([beachRow()], [sample(), sample({ quality: 'buena' })])).toThrow(
      /muestra duplicada/,
    );
  });

  it('rejects invalid dates and missing provenance', () => {
    expect(() => buildDataset([beachRow()], [sample({ date: '14/09/2026' })])).toThrow(
      /YYYY-MM-DD/,
    );
    expect(() => buildDataset([beachRow({ source_url: '' })], [sample()])).toThrow(/source_url/);
  });
});
