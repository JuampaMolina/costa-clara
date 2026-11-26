import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  BeachSample,
  QUALITY_COLORS,
  QUALITY_LABELS,
  QUALITY_RANK,
  WaterQuality,
} from '../../core/models/beach';
import { getSamplesTrend } from '../../core/utils/beach-history';

interface HistoryPoint {
  date: string;
  quality: WaterQuality;
  x: number;
  y: number;
  color: string;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 90;
const CHART_PADDING_X = 14;
const CHART_PADDING_Y = 14;

@Component({
  selector: 'app-beach-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Histórico de calidad
        </p>
        <span [class]="trendClass()">
          @switch (trend()) {
            @case ('mejora') {
              ↑ Mejora
            }
            @case ('empeora') {
              ↓ Empeora
            }
            @case ('estable') {
              → Estable
            }
            @default {
              Sin tendencia
            }
          }
        </span>
      </div>

      @if (ordered().length > 0) {
        <svg viewBox="0 0 300 90" class="mt-2 h-24 w-full" role="img" [attr.aria-label]="summary()">
          <line x1="14" y1="14" x2="286" y2="14" stroke="#e2e8f0" stroke-dasharray="3 3" />
          <line x1="14" y1="45" x2="286" y2="45" stroke="#e2e8f0" stroke-dasharray="3 3" />
          <line x1="14" y1="76" x2="286" y2="76" stroke="#e2e8f0" stroke-dasharray="3 3" />

          @if (points().length > 1) {
            <polyline
              [attr.points]="polyline()"
              fill="none"
              stroke="#94a3b8"
              stroke-width="2"
              stroke-linejoin="round"
            />
          }

          @for (point of points(); track point.date) {
            <circle
              [attr.cx]="point.x"
              [attr.cy]="point.y"
              r="4"
              [attr.fill]="point.color"
              stroke="#ffffff"
              stroke-width="1.5"
            />
          }
        </svg>

        <div class="mt-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>{{ formatDate(first()?.date) }}</span>
          <span>{{ formatDate(latest()?.date) }}</span>
        </div>

        <ul class="mt-2 space-y-1">
          @for (sample of lastThree(); track sample.date) {
            <li class="flex items-center justify-between gap-2 text-[11px]">
              <span class="flex items-center gap-1.5 font-medium text-slate-600">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  [style.background-color]="color(sample.quality)"
                  aria-hidden="true"
                ></span>
                {{ label(sample.quality) }}
              </span>
              <span class="text-slate-400">{{ formatDate(sample.date) }}</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class BeachHistory {
  readonly samples = input.required<BeachSample[]>();

  readonly ordered = computed(() =>
    [...this.samples()].sort((a, b) => a.date.localeCompare(b.date)),
  );

  readonly first = computed(() => this.ordered()[0] ?? null);
  readonly latest = computed(() => this.ordered().at(-1) ?? null);
  readonly lastThree = computed(() => [...this.ordered()].slice(-3).reverse());
  readonly trend = computed(() => getSamplesTrend(this.ordered()));

  readonly points = computed<HistoryPoint[]>(() => {
    const samples = this.ordered();
    const count = samples.length;

    return samples.map((sample, index) => ({
      date: sample.date,
      quality: sample.quality,
      x:
        count === 1
          ? CHART_WIDTH / 2
          : CHART_PADDING_X + (index * (CHART_WIDTH - CHART_PADDING_X * 2)) / (count - 1),
      y:
        CHART_HEIGHT -
        CHART_PADDING_Y -
        (QUALITY_RANK[sample.quality] / 4) * (CHART_HEIGHT - CHART_PADDING_Y * 2),
      color: QUALITY_COLORS[sample.quality],
    }));
  });

  readonly polyline = computed(() =>
    this.points()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  readonly summary = computed(() => {
    const first = this.first();
    const latest = this.latest();
    if (!first || !latest) return 'Sin histórico de calidad.';

    return `Histórico de ${this.ordered().length} muestras, de ${this.formatDate(first.date)} a ${this.formatDate(latest.date)}. Última: ${QUALITY_LABELS[latest.quality]}.`;
  });

  readonly trendClass = computed(() => {
    const base =
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold';

    switch (this.trend()) {
      case 'mejora':
        return `${base} bg-emerald-50 text-emerald-700`;
      case 'empeora':
        return `${base} bg-rose-50 text-rose-600`;
      case 'estable':
        return `${base} bg-slate-100 text-slate-500`;
      default:
        return `${base} bg-slate-100 text-slate-400`;
    }
  });

  label(quality: WaterQuality): string {
    return QUALITY_LABELS[quality];
  }

  color(quality: WaterQuality): string {
    return QUALITY_COLORS[quality];
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';

    return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
