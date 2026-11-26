import { Injectable, OnDestroy, computed, signal } from '@angular/core';

export const FAVORITES_STORAGE_KEY = 'costa-clara:favorites:v1';

@Injectable({ providedIn: 'root' })
export class FavoritesStore implements OnDestroy {
  private readonly ids = signal<ReadonlySet<string>>(this.read());

  readonly count = computed(() => this.ids().size);

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key !== FAVORITES_STORAGE_KEY) return;
    this.ids.set(this.parse(event.newValue));
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorage);
    }
  }

  isFavorite(id: string): boolean {
    return this.ids().has(id);
  }

  toggle(id: string): void {
    const next = new Set(this.ids());

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    this.ids.set(next);
    this.write(next);
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.onStorage);
    }
  }

  private read(): ReadonlySet<string> {
    if (typeof localStorage === 'undefined') return new Set();
    return this.parse(localStorage.getItem(FAVORITES_STORAGE_KEY));
  }

  private parse(raw: string | null): ReadonlySet<string> {
    if (!raw) return new Set();

    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) return new Set();

      return new Set(value.filter((item): item is string => typeof item === 'string'));
    } catch {
      return new Set();
    }
  }

  private write(ids: ReadonlySet<string>): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en memoria.
    }
  }
}
