import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslationService } from '../../core/i18n/translation.service';
import { TranslationKey } from '../../core/i18n/translations';
import { Beach, QUALITY_COLORS } from '../../core/models/beach';
import { AnalyticsService } from '../../core/services/analytics';
import { FavoritesStore } from '../../core/services/favorites';
import {
  MARINE_SOURCE,
  MarineWeather,
  MarineWeatherService,
} from '../../core/services/marine-weather';
import { buildBeachUrl } from '../../core/services/seo';
import { getBeachSamples } from '../../core/utils/beach-history';
import { BeachHistory } from './beach-history';

type MarineState =
  { status: 'loading' } | { status: 'ok'; data: MarineWeather } | { status: 'error' };

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
              {{ i18n.t('detail.blueFlag') }}
            </span>
          }
        </div>

        <div class="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            data-testid="detail-compare"
            [class]="compareButtonClass()"
            [attr.aria-pressed]="isCompared()"
            [attr.aria-label]="
              isCompared()
                ? i18n.t('results.removeCompare', { name: beach().name })
                : i18n.t('results.addCompare', { name: beach().name })
            "
            (click)="compareToggled.emit()"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="7" height="16" rx="1.5" />
              <rect x="14" y="4" width="7" height="16" rx="1.5" />
            </svg>
          </button>

          <button
            type="button"
            data-testid="detail-favorite"
            [class]="favoriteButtonClass()"
            [attr.aria-pressed]="isFavorite()"
            [attr.aria-label]="
              isFavorite() ? i18n.t('detail.removeFavorite') : i18n.t('detail.addFavorite')
            "
            (click)="toggleFavorite()"
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
            class="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            data-testid="detail-share"
            [attr.aria-label]="i18n.t('detail.shareAria')"
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
              <path
                d="M12 16V4M7 9l5-5 5 5M5 20h14"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            class="-mr-1 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            [attr.aria-label]="i18n.t('detail.closeAria')"
            (click)="closed.emit()"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      @if (shareState() !== 'idle') {
        <p [class]="shareStatusClass()" role="status" aria-live="polite">
          {{
            shareState() === 'error' ? i18n.t('detail.linkCopyError') : i18n.t('detail.linkCopied')
          }}
        </p>
      }

      <h2
        #title
        tabindex="-1"
        class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 focus:outline-none"
      >
        {{ beach().name }}
      </h2>
      <p class="mt-0.5 text-sm text-slate-500">{{ islandLabel() }} · {{ beach().municipality }}</p>

      <p class="mt-3 text-sm leading-6 text-slate-600">{{ beach().description }}</p>

      <div class="mt-4 flex flex-wrap gap-1.5">
        @for (service of beach().services; track service) {
          <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {{ service }}
          </span>
        } @empty {
          <span class="text-xs text-slate-500">{{ i18n.t('detail.noServices') }}</span>
        }
      </div>

      <app-beach-history [samples]="samples()" />

      <div aria-live="polite" role="status">
        @if (marineState().status === 'loading') {
          <p class="mt-3 text-xs text-slate-500" data-testid="marine-weather-loading">
            {{ i18n.t('detail.marineLoading') }}
          </p>
        }
      </div>

      @if (marineData(); as marine) {
        <section
          class="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
          data-testid="marine-weather"
          aria-labelledby="marine-weather-title"
        >
          <div class="flex items-center justify-between gap-2">
            <h3
              id="marine-weather-title"
              class="text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              {{ i18n.t('detail.marineTitle') }}
            </h3>
            <span class="text-[11px] text-slate-600">
              @if (marineObservedTime(); as time) {
                {{ i18n.t('detail.marineUpdatedAt', { time }) }}
              } @else {
                {{ i18n.t('detail.marineUpdatedEmpty') }}
              }
            </span>
          </div>

          <dl class="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-xl bg-white/90 px-2 py-2 ring-1 ring-slate-200/70">
              <dt class="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {{ i18n.t('detail.marineWaves') }}
              </dt>
              <dd class="mt-0.5 text-sm font-semibold text-slate-800 tabular-nums">
                {{ formatMetric(marine.waveHeight, 'm', 2) }}
              </dd>
            </div>
            <div class="rounded-xl bg-white/90 px-2 py-2 ring-1 ring-slate-200/70">
              <dt class="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {{ i18n.t('detail.marinePeriod') }}
              </dt>
              <dd class="mt-0.5 text-sm font-semibold text-slate-800 tabular-nums">
                {{ formatMetric(marine.wavePeriod, 's', 1) }}
              </dd>
            </div>
            <div class="rounded-xl bg-white/90 px-2 py-2 ring-1 ring-slate-200/70">
              <dt class="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {{ i18n.t('detail.marineWaterTemp') }}
              </dt>
              <dd class="mt-0.5 text-sm font-semibold text-slate-800 tabular-nums">
                {{ formatMetric(marine.seaTemperature, '°C', 1) }}
              </dd>
            </div>
            <div class="rounded-xl bg-white/90 px-2 py-2 ring-1 ring-slate-200/70">
              <dt class="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {{ i18n.t('detail.marineWind') }}
              </dt>
              <dd class="mt-0.5 text-sm font-semibold text-slate-800 tabular-nums">
                {{ formatMetric(marine.windSpeed, 'km/h', 1) }}
              </dd>
            </div>
            <div class="rounded-xl bg-white/90 px-2 py-2 ring-1 ring-slate-200/70">
              <dt class="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {{ i18n.t('detail.marineWindDirection') }}
              </dt>
              <dd class="mt-0.5 text-sm font-semibold text-slate-800 tabular-nums">
                {{ windDirectionLabel(marine.windDirection) }}
              </dd>
            </div>
          </dl>

          <p class="mt-2 text-[10px] leading-4 text-slate-600">
            {{ i18n.t('detail.sourceLabel') }}
            <a
              [href]="marineSource.url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-sea-700 underline underline-offset-2"
            >
              {{ marineSource.name }}
            </a>
            · {{ marineSource.license }}
          </p>
        </section>
      }

      <dl class="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div>
          <dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {{ i18n.t('detail.latestSample') }}
          </dt>
          <dd class="mt-0.5 font-medium text-slate-700">{{ sampleDate() }}</dd>
        </div>
        <div>
          <dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {{ i18n.t('detail.coordinates') }}
          </dt>
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
          {{ i18n.t('detail.directions') }}
          <svg
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M7 17L17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
        <span class="text-[11px] text-slate-500">
          @if (isDemo()) {
            <span class="text-amber-700">{{ i18n.t('header.demoData') }}</span>
          } @else if (source(); as src) {
            <a
              [href]="src.url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-sea-700 underline underline-offset-2"
            >
              {{ i18n.t('detail.sourceNamed', { name: src.name }) }}
            </a>
          }
        </span>
      </div>

      @if (!isDemo() && source(); as src) {
        <p class="mt-2 text-[10px] leading-4 text-slate-500">
          {{ src.license }}
          @if (updatedAt(); as date) {
            · {{ i18n.t('detail.updatedDate', { date }) }}
          }
        </p>
      }

      <div class="mt-3 border-t border-slate-100 pt-2.5 text-[11px] leading-4 text-slate-600">
        <a
          data-testid="report-data"
          [href]="reportUrl()"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-sea-700 underline underline-offset-2 transition hover:text-sea-900"
        >
          {{ i18n.t('detail.reportLink') }}
        </a>
        <p class="mt-1 text-[10px] leading-4 text-slate-600">
          {{ i18n.t('detail.reportHelp') }}
        </p>
      </div>
    </article>
  `,
})
export class BeachDetail {
  readonly beach = input.required<Beach>();
  readonly shareUrl = input('');
  readonly isCompared = input(false);
  readonly compareToggled = output<void>();
  readonly closed = output<void>();

  readonly i18n = inject(TranslationService);
  readonly favorites = inject(FavoritesStore);
  private readonly marineWeather = inject(MarineWeatherService);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly marineSource = MARINE_SOURCE;
  readonly shareState = signal<'idle' | 'copied' | 'error'>('idle');
  readonly marineState = signal<MarineState>({ status: 'loading' });

  private readonly title = viewChild.required<ElementRef<HTMLHeadingElement>>('title');
  private shareTimer?: ReturnType<typeof setTimeout>;
  private marineRequestToken = 0;
  private lastTrackedBeachId: string | null = null;

  readonly marineData = computed(() => {
    const state = this.marineState();
    return state.status === 'ok' ? state.data : null;
  });
  readonly marineObservedTime = computed(() =>
    formatObservedTime(this.marineData()?.observedAt ?? null, this.i18n.locale()),
  );

  readonly qualityLabel = computed(() => this.i18n.qualityLabel(this.beach().quality));
  readonly qualityColor = computed(() => QUALITY_COLORS[this.beach().quality]);
  readonly islandLabel = computed(() => this.i18n.islandLabel(this.beach().island));
  readonly mapsUrl = computed(
    () =>
      `https://www.google.com/maps/dir/?api=1&destination=${this.beach().lat},${this.beach().lon}`,
  );
  readonly reportUrl = computed(() => {
    const beach = this.beach();
    const detailUrl = buildBeachUrl(beach.id);
    const title = this.i18n.t('detail.reportIssueTitle', { name: beach.name, id: beach.id });
    const body = [
      this.i18n.t('detail.reportIssueBeach', { name: beach.name, id: beach.id }),
      this.i18n.t('detail.reportIssueField'),
      this.i18n.t('detail.reportIssueUrl', { url: detailUrl }),
      '',
      this.i18n.t('detail.reportIssuePrompt'),
      '',
      this.i18n.t('detail.reportIssueNote'),
    ].join('\n');

    return `https://github.com/JuampaMolina/costa-clara/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  });
  readonly sampleDate = computed(() => this.i18n.formatDate(this.beach().lastSample));

  readonly samples = computed(() => getBeachSamples(this.beach()));
  readonly isDemo = computed(() => this.beach().dataStatus !== 'real');
  readonly source = computed(() => this.beach().source ?? null);
  readonly updatedAt = computed(() => {
    const value = this.beach().updatedAt;
    return value ? this.i18n.formatDate(value) : null;
  });

  readonly isFavorite = computed(() => this.favorites.isFavorite(this.beach().id));

  readonly compareButtonClass = computed(() => {
    const base = 'rounded-full p-1.5 transition';
    return this.isCompared()
      ? `${base} bg-sea-50 text-sea-700 ring-1 ring-sea-200`
      : `${base} text-slate-500 hover:bg-slate-100 hover:text-slate-700`;
  });

  readonly favoriteButtonClass = computed(() => {
    const base = 'rounded-full p-1.5 transition';
    return this.isFavorite()
      ? `${base} text-rose-500 hover:bg-rose-50`
      : `${base} text-slate-500 hover:bg-slate-100 hover:text-slate-700`;
  });

  readonly shareStatusClass = computed(
    () =>
      `mt-2 text-xs font-medium ${this.shareState() === 'error' ? 'text-rose-700' : 'text-emerald-700'}`,
  );

  constructor() {
    afterNextRender(() => this.title().nativeElement.focus({ preventScroll: true }));
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.shareTimer);
      this.marineRequestToken += 1;
    });

    effect(() => {
      const beach = this.beach();

      if (this.lastTrackedBeachId !== beach.id) {
        this.lastTrackedBeachId = beach.id;
        this.analytics.track('beach_open', {
          beach: beach.id,
          island: beach.island,
        });
      }

      void this.loadMarineWeather(beach.lat, beach.lon);
    });
  }

  toggleFavorite(): void {
    const beach = this.beach();
    this.favorites.toggle(beach.id);
    this.analytics.track('favorite', {
      beach: beach.id,
      active: this.favorites.isFavorite(beach.id),
    });
  }

  formatMetric(value: number | null, unit: string, maxDecimals = 1): string {
    if (value === null) return '—';

    return `${this.i18n.formatNumber(value, { maximumFractionDigits: maxDecimals })} ${unit}`;
  }

  windDirectionLabel(value: number | null): string {
    if (value === null) return '—';

    const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
    const normalized = ((value % 360) + 360) % 360;
    const point = points[Math.round(normalized / 45) % 8];

    return this.i18n.t(`detail.windDir.${point}` as TranslationKey);
  }

  async share(): Promise<void> {
    const url = this.shareUrl();
    if (!url) return;

    const data = {
      title: this.i18n.t('seo.beachTitle', { name: this.beach().name }),
      text: this.i18n.t('detail.shareText', { name: this.beach().name }),
      url,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        this.analytics.track('share', {
          beach: this.beach().id,
          method: 'web-share',
        });
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
      this.analytics.track('share', {
        beach: this.beach().id,
        method: 'clipboard',
      });
    } catch {
      this.setShareState('error');
    }
  }

  private async loadMarineWeather(lat: number, lon: number): Promise<void> {
    const token = ++this.marineRequestToken;
    this.marineState.set({ status: 'loading' });

    try {
      const result = await this.marineWeather.get(lat, lon);
      if (token !== this.marineRequestToken) return;

      if (result.status === 'ok') {
        this.marineState.set({ status: 'ok', data: result.data });
      } else {
        this.marineState.set({ status: 'error' });
      }
    } catch {
      if (token === this.marineRequestToken) {
        this.marineState.set({ status: 'error' });
      }
    }
  }

  private setShareState(state: 'copied' | 'error'): void {
    this.shareState.set(state);
    clearTimeout(this.shareTimer);
    this.shareTimer = setTimeout(() => this.shareState.set('idle'), 2500);
  }
}

function formatObservedTime(value: string | null, locale: string): string | null {
  if (!value) return null;

  const match = /T(\d{2}:\d{2})/.exec(value);
  if (match) return match[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
