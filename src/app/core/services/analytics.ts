import { Injectable } from '@angular/core';

/**
 * Analítica respetuosa con la privacidad (CC-43).
 *
 * Sin cookies, sin datos personales y sin red por defecto. `track` emite un
 * `CustomEvent` (`costa-clara:analytics`) en la página; si existe
 * `window.plausible` (script de Plausible cargado aparte), se reenvía el
 * evento, y si no, no se envía nada por la red.
 *
 * Reglas para quien llame a `track`:
 * - Solo eventos agregados (búsquedas, filtros, aperturas), nunca PII.
 * - No pasar emails, IPs, ubicación exacta ni identificadores de usuario.
 */

export const ANALYTICS_EVENT_NAME = 'costa-clara:analytics';

export type AnalyticsEvent =
  'search' | 'filter' | 'beach_open' | 'compare_open' | 'share' | 'favorite';

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export interface AnalyticsDetail {
  event: AnalyticsEvent;
  props: Record<string, string | number | boolean>;
}

interface PlausibleOptions {
  props?: Record<string, string | number | boolean>;
}

type PlausibleFunction = (event: string, options?: PlausibleOptions) => void;

declare global {
  interface Window {
    plausible?: PlausibleFunction;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
    const clean = this.sanitize(props);

    this.emit(event, clean);
    this.sendToPlausible(event, clean);
  }

  private emit(event: AnalyticsEvent, props: Record<string, string | number | boolean>): void {
    if (typeof window === 'undefined') return;

    const detail: AnalyticsDetail = { event, props };
    window.dispatchEvent(new CustomEvent<AnalyticsDetail>(ANALYTICS_EVENT_NAME, { detail }));
  }

  private sendToPlausible(
    event: AnalyticsEvent,
    props: Record<string, string | number | boolean>,
  ): void {
    if (typeof window === 'undefined' || typeof window.plausible !== 'function') return;

    try {
      window.plausible(event, { props });
    } catch {
      // La analítica nunca debe romper la aplicación.
    }
  }

  private sanitize(props: AnalyticsProps): Record<string, string | number | boolean> {
    const clean: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        clean[key] = value;
      }
    }

    return clean;
  }
}
