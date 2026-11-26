import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TranslationService } from '../i18n/translation.service';
import { Beach } from '../models/beach';
import {
  BEACH_JSONLD_ID,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  HOME_URL,
  OG_IMAGE_URL,
  SeoService,
  buildBeachJsonLd,
  buildBeachUrl,
} from './seo';

const ES_TRENC: Beach = {
  id: 'es-trenc',
  name: 'Es Trenc',
  municipality: 'Campos',
  island: 'mallorca',
  lon: 2.9828,
  lat: 39.3406,
  quality: 'excelente',
  blueFlag: true,
  services: ['Socorrista', 'Aseos'],
  description: 'Arena blanca y aguas turquesas.',
  lastSample: '2026-09-14',
};

const CALA_MACARELLA: Beach = {
  id: 'cala-macarella',
  name: 'Cala Macarella',
  municipality: 'Ciutadella de Menorca',
  island: 'menorca',
  lon: 3.936,
  lat: 39.936,
  quality: 'excelente',
  blueFlag: false,
  services: ['Socorrista'],
  description: 'Agua transparente, arena blanca y pinos hasta la orilla.',
  lastSample: '2026-09-11',
};

describe('SeoService', () => {
  let service: SeoService;
  let doc: Document;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    doc = TestBed.inject(DOCUMENT);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);

    doc.head.querySelectorAll('link[rel="canonical"]').forEach((node) => node.remove());
    doc.getElementById(BEACH_JSONLD_ID)?.remove();
  });

  afterEach(() => {
    doc.head.querySelectorAll('link[rel="canonical"]').forEach((node) => node.remove());
    doc.getElementById(BEACH_JSONLD_ID)?.remove();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('construye la URL canónica de una playa sin filtros', () => {
    expect(buildBeachUrl('es-trenc')).toBe('https://costa-clara-k23.pages.dev/?playa=es-trenc');
  });

  it('construye JSON-LD TouristAttraction/Beach solo con datos reales del modelo', () => {
    expect(buildBeachJsonLd(ES_TRENC)).toEqual({
      '@context': 'https://schema.org',
      '@type': ['TouristAttraction', 'Beach'],
      name: 'Es Trenc',
      description: 'Arena blanca y aguas turquesas.',
      url: 'https://costa-clara-k23.pages.dev/?playa=es-trenc',
      image: OG_IMAGE_URL,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 39.3406,
        longitude: 2.9828,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Campos',
        addressRegion: 'Illes Balears',
        addressCountry: 'ES',
      },
      isAccessibleForFree: true,
      publicAccess: true,
    });
  });

  it('actualiza título, metas, canonical, og:url y JSON-LD al seleccionar una playa', () => {
    service.update(ES_TRENC);

    expect(title.getTitle()).toBe('Es Trenc · Costa Clara');
    expect(meta.getTag('name="description"')?.content).toContain('Es Trenc (Mallorca, Campos)');
    expect(meta.getTag('property="og:title"')?.content).toBe('Es Trenc · Costa Clara');
    expect(meta.getTag('property="og:url"')?.content).toBe(
      'https://costa-clara-k23.pages.dev/?playa=es-trenc',
    );
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://costa-clara-k23.pages.dev/?playa=es-trenc',
    );

    const script = doc.getElementById(BEACH_JSONLD_ID);
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script?.textContent ?? '{}')).toEqual(buildBeachJsonLd(ES_TRENC));
  });

  it('reemplaza el canonical y el JSON-LD al cambiar de playa sin duplicar nodos', () => {
    service.update(ES_TRENC);
    service.update(CALA_MACARELLA);

    expect(doc.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(doc.head.querySelectorAll(`#${BEACH_JSONLD_ID}`)).toHaveLength(1);
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://costa-clara-k23.pages.dev/?playa=cala-macarella',
    );
    expect(meta.getTag('property="og:url"')?.content).toBe(
      'https://costa-clara-k23.pages.dev/?playa=cala-macarella',
    );
    expect(JSON.parse(doc.getElementById(BEACH_JSONLD_ID)?.textContent ?? '{}').name).toBe(
      'Cala Macarella',
    );
  });

  it('restaura la home y elimina el JSON-LD de playa al volver a null', () => {
    service.update(ES_TRENC);
    service.update(null);

    expect(title.getTitle()).toBe(DEFAULT_TITLE);
    expect(meta.getTag('name="description"')?.content).toBe(DEFAULT_DESCRIPTION);
    expect(meta.getTag('property="og:url"')?.content).toBe(HOME_URL);
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(HOME_URL);
    expect(doc.getElementById(BEACH_JSONLD_ID)).toBeNull();
  });

  it('traduce el título y las descripciones según el idioma activo', () => {
    const i18n = TestBed.inject(TranslationService);

    i18n.setLang('en');
    service.update(null);
    expect(title.getTitle()).toBe('Costa Clara · Balearic Beaches');
    expect(meta.getTag('name="description"')?.content).toContain('Interactive map');

    service.update(ES_TRENC);
    expect(title.getTitle()).toBe('Es Trenc · Costa Clara');
    expect(meta.getTag('name="description"')?.content).toContain('excellent water quality');

    i18n.setLang('ca');
    service.update(null);
    expect(title.getTitle()).toBe('Costa Clara · Platges de les Balears');
    expect(meta.getTag('name="description"')?.content).toContain('Mapa interactiu');
  });
});
