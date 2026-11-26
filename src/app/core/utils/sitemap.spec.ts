import { describe, expect, it } from 'vitest';
import { Beach } from '../models/beach';
import { buildSitemap } from './sitemap';

const BASE_URL = 'https://costa-clara-k23.pages.dev';

function beach(id: string): Beach {
  return {
    id,
    name: id,
    municipality: 'Municipio',
    island: 'mallorca',
    lon: 2.5,
    lat: 39.5,
    quality: 'buena',
    blueFlag: false,
    services: [],
    description: 'Descripción de ejemplo',
    lastSample: '2026-09-14',
  };
}

describe('buildSitemap (CC-53)', () => {
  it('incluye la home y una entrada ?playa= por cada playa, en orden', () => {
    const xml = buildSitemap([beach('es-trenc'), beach('cala-macarella')], BASE_URL, '2026-11-26');

    expect(xml).toContain('<loc>https://costa-clara-k23.pages.dev/</loc>');
    expect(xml).toContain('<loc>https://costa-clara-k23.pages.dev/?playa=es-trenc</loc>');
    expect(xml).toContain('<loc>https://costa-clara-k23.pages.dev/?playa=cala-macarella</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(3);

    const homeIndex = xml.indexOf('costa-clara-k23.pages.dev/</loc>');
    const trencIndex = xml.indexOf('playa=es-trenc');
    expect(homeIndex).toBeLessThan(trencIndex);
  });

  it('normaliza la URL base con barra final', () => {
    const xml = buildSitemap([], 'https://costa-clara-k23.pages.dev', '2026-11-26');

    expect(xml).toContain('<loc>https://costa-clara-k23.pages.dev/</loc>');
    expect(xml).not.toContain('<loc>https://costa-clara-k23.pages.dev</loc>');
  });

  it('usa el lastmod y la frecuencia dados en todas las entradas', () => {
    const xml = buildSitemap([beach('es-trenc')], BASE_URL, '2026-01-02');

    expect(xml).toContain('<lastmod>2026-01-02</lastmod>');
    expect(xml).toContain('<changefreq>monthly</changefreq>');
    expect(xml.match(/<lastmod>2026-01-02<\/lastmod>/g)).toHaveLength(2);
  });

  it('asigna prioridad 1.0 a la home y 0.8 a las playas', () => {
    const xml = buildSitemap([beach('es-trenc')], BASE_URL, '2026-11-26');

    expect(xml).toContain('<priority>1.0</priority>');
    expect(xml).toContain('<priority>0.8</priority>');
    expect(xml.match(/<priority>1\.0<\/priority>/g)).toHaveLength(1);
    expect(xml.match(/<priority>0\.8<\/priority>/g)).toHaveLength(1);
  });

  it('escapa caracteres XML en la URL base y el lastmod', () => {
    const xml = buildSitemap([], 'https://example.com/?a=1&b=2', '2026<11>26');

    expect(xml).toContain('&amp;');
    expect(xml).toContain('&lt;');
    expect(xml).toContain('&gt;');
    expect(xml).not.toContain('<loc>https://example.com/?a=1&b=2/</loc>');
  });

  it('devuelve solo la home con una lista de playas vacía', () => {
    const xml = buildSitemap([], BASE_URL, '2026-11-26');

    expect(xml.match(/<url>/g)).toHaveLength(1);
    expect(xml).toContain('<loc>https://costa-clara-k23.pages.dev/</loc>');
  });
});
