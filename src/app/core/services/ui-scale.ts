import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'costa-clara:ui-scale:v1';

/**
 * Factores de escala sobre la base automática (que crece con el ancho de pantalla).
 * A 1440 px la base es 16 px, así que el nivel por defecto no cambia nada.
 */
const FACTORS = [0.9, 1, 1.1, 1.2, 1.3] as const;
const DEFAULT_INDEX = 1;

/** Ajusta el tamaño de toda la interfaz (basado en rem) y lo recuerda entre visitas. */
@Injectable({ providedIn: 'root' })
export class UiScaleService {
  private readonly indexSignal = signal(this.readIndex());

  readonly index = this.indexSignal.asReadonly();
  readonly canDecrease = computed(() => this.indexSignal() > 0);
  readonly canIncrease = computed(() => this.indexSignal() < FACTORS.length - 1);

  constructor() {
    this.apply();
  }

  decrease(): void {
    this.setIndex(this.indexSignal() - 1);
  }

  increase(): void {
    this.setIndex(this.indexSignal() + 1);
  }

  reset(): void {
    this.setIndex(DEFAULT_INDEX);
  }

  private setIndex(index: number): void {
    const next = Math.min(FACTORS.length - 1, Math.max(0, index));
    this.indexSignal.set(next);

    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Sin persistencia la escala sigue funcionando en esta sesión.
    }

    this.apply();
  }

  private apply(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--ui-factor', String(FACTORS[this.indexSignal()]));
  }

  private readIndex(): number {
    if (typeof localStorage === 'undefined') return DEFAULT_INDEX;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_INDEX;

    const index = Number(raw);
    return Number.isInteger(index) && index >= 0 && index < FACTORS.length ? index : DEFAULT_INDEX;
  }
}
