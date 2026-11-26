import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Beach, ISLANDS, QUALITY_COLORS, QUALITY_LABELS } from '../../core/models/beach';
import { FavoritesStore } from '../../core/services/favorites';
import { getBeachSamples } from '../../core/utils/beach-history';
import { BeachHistory } from './beach-history';

@Component({
  selector: 'app-beach-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BeachHistory],
  host: {
    class: 'absolute inset-x-3 bottom-3 top-3 z-30 sm:left-auto sm:top-auto sm:w-[370px]',
  },
  template: `
    <article
      class="max-h-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:max-h-[calc(100dvh-6rem)]"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full" [style.background-color]="qualityColor()"></span>
          <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {{ qualityLabel() }}
          </span>
          @if (beach().blueFlag) {
            <span class="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              Bandera azul
            </span>
          }
        </div>

        <div class="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            data-testid="detail-favorite"
            [class]="favoriteButtonClass()"
            [attr.aria-pressed]="isFavorite()"
            [attr.aria-label]="isFavorite() ? 'Quitar de favoritas' : 'Añadir a favoritas'"
            (click)="favorites.toggle(beach().id)"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              [attr.fill]="isFavorite() ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            class="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            data-testid="detail-share"
            aria-label="Compartir playa"
            (click)="share()"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M12 16V4M7 9l5-5 5 5M5 20h14" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            class="-mr-1 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar ficha"
            (click)="closed.emit()"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      @if (shareState() !== 'idle') {
        <p [class]="shareStatusClass()" role="status" aria-live="polite">
          {{ shareState() === 'error' ? 'No se pudo copiar el enlace' : 'Enlace copiado' }}
        </p>
      }

      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{{ beach().name }}</h2>
      <p class="mt-0.5 text-sm text-slate-500">{{ islandLabel() }} · {{ beach().municipality }}</p>

      <p class="mt-3 text-sm leading-6 text-slate-600">{{ beach().description }}</p>

      <div class="mt-4 flex flex-wrap gap-1.5">
        @for (service of beach().services; track service) {
          <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {{ service }}
          </span>
        } @empty {
          <span class="text-xs text-slate-400">Sin servicios en la ficha</span>
        }
      </div>

      <app-beach-history [samples]="samples()" />

      <dl class="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div>
          <dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Última muestra</dt>
          <dd class="mt-0.5 font-medium text-slate-700">{{ sampleDate() }}</dd>
        </div>
        <div>
          <dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Coordenadas</dt>
          <dd class="mt-0.5 font-medium text-slate-700">
            {{ beach().lat.toFixed(4) }}, {{ beach().lon.toFixed(4) }}
          </dd>
        </div>
      </dl>

      <div class="mt-4 flex items-center justify-between gap-3">
        <a
          class="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          [href]="mapsUrl()"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cómo llegar
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
        <span class="text-[11px] text-slate-400">
          @if (isDemo()) {
            <span class="text-amber-600">Datos de demostración</span>
          } @else if (source(); as src) {
            <a
              [href]="src.url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-sea-700 underline underline-offset-2"
            >
              Fuente: {{ src.name }}
            </a>
          }
        </span>
      </div>

      @if (!isDemo() && source(); as src) {
        <p class="mt-2 text-[10px] leading-4 text-slate-400">
          {{ src.license }}
          @if (updatedAt()) {
            · Actualizado {{ updatedAt() }}
          }
        </p>
      }
    </article>
  `,
})
export class BeachDetail {
  readonly beach = input.required<Beach>();
  readonly shareUrl = input('');
  readonly closed = output<void>();

  readonly favorites = inject(FavoritesStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly shareState = signal<'idle' | 'copied' | 'error'>('idle');

  private shareTimer?: ReturnType<typeof setTimeout>;

  readonly qualityLabel = computed(() => QUALITY_LABELS[this.beach().quality]);
  readonly qualityColor = computed(() => QUALITY_COLORS[this.beach().quality]);
  readonly islandLabel = computed(
    () => ISLANDS.find((island) => island.id === this.beach().island)?.label ?? this.beach().island
  );
  readonly mapsUrl = computed(
    () =>
      `https://www.google.com/maps/dir/?api=1&destination=${this.beach().lat},${this.beach().lon}`
  );
  readonly sampleDate = computed(() =>
    new Date(this.beach().lastSample).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  );

  readonly samples = computed(() => getBeachSamples(this.beach()));
  readonly isDemo = computed(() => this.beach().dataStatus !== 'real');
  readonly source = computed(() => this.beach().source ?? null);
  readonly updatedAt = computed(() => {
    const value = this.beach().updatedAt;
    if (!value) return null;

    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  readonly isFavorite = computed(() => this.favorites.isFavorite(this.beach().id));

  readonly favoriteButtonClass = computed(() => {
    const base = 'rounded-full p-1.5 transition';
    return this.isFavorite()
      ? `${base} text-rose-500 hover:bg-rose-50`
      : `${base} text-slate-400 hover:bg-slate-100 hover:text-slate-700`;
  });

  readonly shareStatusClass = computed(
    () =>
      `mt-2 text-xs font-medium ${this.shareState() === 'error' ? 'text-rose-600' : 'text-emerald-600'}`
  );

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.shareTimer));
  }

  async share(): Promise<void> {
    const url = this.shareUrl();
    if (!url) return;

    const data = {
      title: `${this.beach().name} · Costa Clara`,
      text: `Consulta ${this.beach().name} en Costa Clara`,
      url,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if ((error as { name?: string } | null)?.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard no disponible');
      }

      await navigator.clipboard.writeText(url);
      this.setShareState('copied');
    } catch {
      this.setShareState('error');
    }
  }

  private setShareState(state: 'copied' | 'error'): void {
    this.shareState.set(state);
    clearTimeout(this.shareTimer);
    this.shareTimer = setTimeout(() => this.shareState.set('idle'), 2500);
  }
}
