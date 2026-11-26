import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { Accessibility, IslandId, WaterQuality } from '../models/beach';
import { QualityTrend } from '../utils/beach-history';
import {
  DEFAULT_LANG,
  LANG_LOCALES,
  Lang,
  SUPPORTED_LANGS,
  TRANSLATIONS,
  TranslationKey,
} from './translations';

export const LANG_STORAGE_KEY = 'costa-clara:lang';

export type TranslationParams = Record<string, string | number>;

export function parseLang(raw: string | null | undefined): Lang | null {
  if (!raw) return null;

  const normalized = raw.trim().toLowerCase();
  return (SUPPORTED_LANGS as readonly string[]).includes(normalized) ? (normalized as Lang) : null;
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = params[token];
    return value !== undefined ? String(value) : match;
  });
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly _lang = signal<Lang>(this.resolveInitialLang());

  readonly lang = this._lang.asReadonly();
  readonly locale = computed(() => LANG_LOCALES[this._lang()]);

  constructor() {
    this.syncDocumentLang(this._lang());
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    const active = TRANSLATIONS[this._lang()];
    const template = active?.[key] || TRANSLATIONS[DEFAULT_LANG][key] || key;
    return interpolate(template, params);
  }

  setLang(lang: Lang): void {
    const next = parseLang(lang) ?? DEFAULT_LANG;
    this._lang.set(next);
    this.syncDocumentLang(next);
    this.writeStorage(next);
  }

  /** Sincroniza el idioma desde la URL sin sobrescribir la preferencia guardada. */
  syncFromUrl(raw: string | null | undefined): void {
    const fromUrl = parseLang(raw);
    if (!fromUrl || fromUrl === this._lang()) return;

    this._lang.set(fromUrl);
    this.syncDocumentLang(fromUrl);
  }

  langLabel(lang: Lang): string {
    return this.t(`lang.${lang}`);
  }

  islandLabel(island: IslandId | 'todas'): string {
    return this.t(`island.${island}`);
  }

  qualityLabel(quality: WaterQuality | 'todas'): string {
    return this.t(`quality.${quality}`);
  }

  accessibilityLabel(level: Accessibility | 'todas'): string {
    return this.t(`accessibility.${level}`);
  }

  trendLabel(trend: QualityTrend): string {
    return this.t(`trend.${trend}`);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';

    const normalized = date.length === 10 ? `${date}T00:00:00` : `${date.slice(0, 10)}T00:00:00`;
    return new Date(normalized).toLocaleDateString(this.locale(), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return value.toLocaleString(this.locale(), options);
  }

  formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;

    return `${this.formatNumber(km, { maximumFractionDigits: 1 })} km`;
  }

  private resolveInitialLang(): Lang {
    const search = this.document.defaultView?.location?.search ?? '';
    if (search) {
      const fromUrl = parseLang(new URLSearchParams(search).get('lang'));
      if (fromUrl) return fromUrl;
    }

    const fromStorage = this.readStorage();
    if (fromStorage) return fromStorage;

    return DEFAULT_LANG;
  }

  private syncDocumentLang(lang: Lang): void {
    if (this.document.documentElement) {
      this.document.documentElement.lang = lang;
    }
  }

  private readStorage(): Lang | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      return parseLang(localStorage.getItem(LANG_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  private writeStorage(lang: Lang): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Sin almacenamiento disponible: el idioma sigue activo en memoria.
    }
  }
}
