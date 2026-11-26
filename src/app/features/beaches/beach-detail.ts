import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Beach, ISLANDS, QUALITY_COLORS, QUALITY_LABELS } from '../../core/models/beach';

@Component({
  selector: 'app-beach-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'absolute inset-x-3 bottom-3 z-10 sm:left-auto sm:w-[370px]',
  },
  template: `
    <article
      class="max-h-[calc(100%-1rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-2">
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
        <button
          type="button"
          class="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar ficha"
          (click)="closed.emit()"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>

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
        <span class="text-[11px] text-slate-400">Datos de demostración</span>
      </div>
    </article>
  `,
})
export class BeachDetail {
  readonly beach = input.required<Beach>();
  readonly closed = output<void>();

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
}
