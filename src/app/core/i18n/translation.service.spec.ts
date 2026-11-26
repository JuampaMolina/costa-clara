import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LANG_STORAGE_KEY, TranslationService, parseLang } from './translation.service';
import { TRANSLATIONS, TranslationKey } from './translations';

describe('TranslationService', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('usa español por defecto y actualiza documentElement.lang', () => {
    const service = TestBed.inject(TranslationService);
    const doc = TestBed.inject(DOCUMENT);

    expect(service.lang()).toBe('es');
    expect(service.locale()).toBe('es-ES');
    expect(doc.documentElement.lang).toBe('es');
    expect(service.t('filters.heading')).toBe('Encuentra tu playa');
  });

  it('cambia de idioma, actualiza locale, html[lang] y persiste en localStorage', () => {
    const service = TestBed.inject(TranslationService);
    const doc = TestBed.inject(DOCUMENT);

    service.setLang('en');
    expect(service.lang()).toBe('en');
    expect(service.locale()).toBe('en-GB');
    expect(doc.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');
    expect(service.t('filters.heading')).toBe('Find your beach');

    service.setLang('ca');
    expect(service.lang()).toBe('ca');
    expect(service.locale()).toBe('ca-ES');
    expect(doc.documentElement.lang).toBe('ca');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('ca');
    expect(service.t('filters.heading')).toBe('Troba la teva platja');
  });

  it('recupera el idioma inicial desde localStorage y prioriza ?lang= de la URL', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'ca');
    let service = TestBed.inject(TranslationService);
    expect(service.lang()).toBe('ca');
    expect(service.locale()).toBe('ca-ES');

    TestBed.resetTestingModule();
    window.history.replaceState({}, '', '/?lang=en');
    service = TestBed.inject(TranslationService);
    expect(service.lang()).toBe('en');
    expect(service.locale()).toBe('en-GB');
  });

  it('interpola parámetros en las traducciones y conserva placeholders sin valor', () => {
    const service = TestBed.inject(TranslationService);

    expect(service.t('results.favorites', { count: 3 })).toBe('Favoritas (3)');
    expect(service.t('empty.noSearchTitle', { query: 'Es Trenc' })).toBe(
      'No hay playas para «Es Trenc»',
    );
    expect(service.t('results.favorites')).toBe('Favoritas ({count})');

    service.setLang('en');
    expect(service.t('compare.countOfMax', { count: 2, max: 3 })).toBe('2 of 3 beaches');
  });

  it('hace fallback a español con valores inválidos o claves faltantes en el idioma activo', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'fr');
    window.history.replaceState({}, '', '/?lang=de');
    const service = TestBed.inject(TranslationService);

    expect(parseLang('fr')).toBeNull();
    expect(service.lang()).toBe('es');
    expect(service.locale()).toBe('es-ES');

    service.setLang('en');
    const original = TRANSLATIONS.en['filters.heading'];
    try {
      (TRANSLATIONS.en as Record<TranslationKey, string>)['filters.heading'] = '';
      expect(service.t('filters.heading')).toBe('Encuentra tu playa');
    } finally {
      (TRANSLATIONS.en as Record<TranslationKey, string>)['filters.heading'] = original;
    }

    service.setLang('xx' as never);
    expect(service.lang()).toBe('es');
  });

  it('formatea fechas y distancias según el locale activo', () => {
    const service = TestBed.inject(TranslationService);

    expect(service.formatDistance(0.45)).toBe('450 m');
    expect(service.formatDistance(12.34)).toBe('12,3 km');
    const esDate = service.formatDate('2026-09-14');

    service.setLang('en');
    expect(service.formatDistance(12.34)).toBe('12.3 km');
    const enDate = service.formatDate('2026-09-14');
    expect(enDate).toContain('2026');
    expect(enDate).toContain('14');
    expect(esDate).toContain('2026');
  });
});
