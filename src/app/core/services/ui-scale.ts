import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'costa-clara:ui-scale:v2';
const BASE_PX = 16;

export type UiScaleValue = 'auto' | '100' | '110' | '125' | '150';

const VALUES: readonly UiScaleValue[] = ['auto', '100', '110', '125', '150'];

/**
 * Ajusta el tamaño de toda la interfaz (basado en rem).
 *
 * - `auto`: base según el ancho de pantalla (16–20 px), definida en `styles.css`.
 * - `100`–`150`: fija el tamaño base a un porcentaje de 16 px.
 *
 * La elección se recuerda entre visitas.
 */
@Injectable({ providedIn: 'root' })
export class UiScaleService {
  private readonly valueSignal = signal<UiScaleValue>(this.read());

  readonly value = this.valueSignal.asReadonly();
  readonly options = VALUES;

  constructor() {
    this.apply();
  }

  set(value: string): void {
    if (!VALUES.includes(value as UiScaleValue)) return;

    const next = value as UiScaleValue;
    this.valueSignal.set(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin persistencia el zoom sigue funcionando en esta sesión.
    }

    this.apply();
  }

  private apply(): void {
    if (typeof document === 'undefined') return;

    const value = this.valueSignal();
    if (value === 'auto') {
      document.documentElement.style.removeProperty('--ui-base');
      return;
    }

    document.documentElement.style.setProperty('--ui-base', `${(BASE_PX * Number(value)) / 100}px`);
  }

  private read(): UiScaleValue {
    if (typeof localStorage === 'undefined') return 'auto';

    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && VALUES.includes(raw as UiScaleValue) ? (raw as UiScaleValue) : 'auto';
  }
}
