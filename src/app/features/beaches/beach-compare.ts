import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslationService } from '../../core/i18n/translation.service';
import { Beach, QUALITY_COLORS, ServiceId, WaterQuality } from '../../core/models/beach';
import { AnalyticsService } from '../../core/services/analytics';
import {
  MAX_COMPARE_BEACHES,
  getAvailableServices,
  getBeachAccessibility,
} from '../../core/utils/beach-filter';
import { QualityTrend, getBeachSamples, getSamplesTrend } from '../../core/utils/beach-history';
import { Coordinates, distanceKm } from '../../core/utils/geo';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-beach-compare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  template: `
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-2 backdrop-blur-[2px] sm:items-center sm:p-4"
      data-testid="compare-backdrop"
      (click)="onBackdropClick($event)"
    >
      <div
        #dialogPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        data-testid="compare-dialog"
        class="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-6"
        >
          <div>
            <h2 id="compare-title" class="text-lg font-semibold tracking-tight text-slate-900">
              {{ i18n.t('compare.dialogTitle') }}
            </h2>
            <p class="text-xs text-slate-500">
              {{
                i18n.t('compare.countOfMax', {
                  count: beaches().length,
                  max: maxCompareBeaches,
                })
              }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              data-testid="compare-share"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              (click)="share()"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-3.5 w-3.5"
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
              {{ i18n.t('compare.copyLink') }}
            </button>

            <button
              type="button"
              data-testid="compare-clear"
              class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              (click)="cleared.emit()"
            >
              {{ i18n.t('compare.clear') }}
            </button>

            <button
              #closeButton
              type="button"
              data-testid="compare-close"
              [attr.aria-label]="i18n.t('compare.closeAria')"
              class="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
        </header>

        @if (shareState() !== 'idle') {
          <p
            [class]="shareStatusClass()"
            role="status"
            aria-live="polite"
            data-testid="compare-share-status"
          >
            {{
              shareState() === 'error'
                ? i18n.t('detail.linkCopyError')
                : i18n.t('detail.linkCopied')
            }}
          </p>
        }

        <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <!-- Vista escritorio (>= 768 px): tabla semántica -->
          <div class="hidden md:block">
            <table
              class="w-full table-fixed border-collapse text-left text-sm"
              data-testid="compare-table"
            >
              <caption class="sr-only">
                {{
                  i18n.t('compare.tableCaption')
                }}
              </caption>
              <thead>
                <tr class="border-b border-slate-200 align-top">
                  <th scope="col" class="w-40 pb-3 pr-3 text-xs font-semibold text-slate-500">
                    <span class="sr-only">{{ i18n.t('compare.attributeHeader') }}</span>
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <th scope="col" class="pb-3 pl-3">
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <button
                            type="button"
                            class="text-left text-base font-semibold tracking-tight text-slate-900 transition hover:text-sea-700"
                            (click)="selected.emit(beach)"
                          >
                            {{ beach.name }}
                          </button>
                          <p class="mt-0.5 text-xs font-normal text-slate-500">
                            {{ beach.municipality }} · {{ islandLabel(beach.island) }}
                          </p>
                        </div>
                        <button
                          type="button"
                          class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                          [attr.aria-label]="i18n.t('results.removeCompare', { name: beach.name })"
                          [attr.data-testid]="'compare-remove-' + beach.id"
                          (click)="removed.emit(beach.id)"
                        >
                          {{ i18n.t('compare.remove') }}
                        </button>
                      </div>
                    </th>
                  }
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                <tr>
                  <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                    {{ i18n.t('compare.waterQuality') }}
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <td class="py-3 pl-3">
                      <span class="inline-flex items-center gap-2 font-medium text-slate-800">
                        <span
                          class="h-2.5 w-2.5 shrink-0 rounded-full"
                          [style.background-color]="qualityColor(beach.quality)"
                          aria-hidden="true"
                        ></span>
                        {{ qualityLabel(beach.quality) }}
                      </span>
                    </td>
                  }
                </tr>

                <tr>
                  <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                    {{ i18n.t('compare.trend') }}
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <td class="py-3 pl-3">
                      <span [class]="trendClass(beach)">{{ trendLabel(beach) }}</span>
                    </td>
                  }
                </tr>

                <tr>
                  <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                    {{ i18n.t('compare.blueFlag') }}
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <td class="py-3 pl-3">
                      @if (beach.blueFlag) {
                        <span
                          class="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700"
                        >
                          {{ i18n.t('compare.yes')
                          }}{{ beach.blueFlagYear ? ' (' + beach.blueFlagYear + ')' : '' }}
                        </span>
                      } @else {
                        <span class="text-slate-500">{{ i18n.t('compare.no') }}</span>
                      }
                    </td>
                  }
                </tr>

                <tr>
                  <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                    {{ i18n.t('compare.islandAndMunicipality') }}
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <td class="py-3 pl-3 text-slate-700">
                      {{ islandLabel(beach.island) }} · {{ beach.municipality }}
                    </td>
                  }
                </tr>

                @if (userLocation()) {
                  <tr>
                    <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                      {{ i18n.t('compare.distance') }}
                    </th>
                    @for (beach of beaches(); track beach.id) {
                      <td class="py-3 pl-3 font-medium text-sea-700">
                        {{ i18n.t('results.distanceAway', { distance: distanceLabel(beach) }) }}
                      </td>
                    }
                  </tr>
                }

                <tr>
                  <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                    {{ i18n.t('compare.accessibility') }}
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <td class="py-3 pl-3 text-slate-700">
                      {{ accessibilityLabel(beach) }}
                    </td>
                  }
                </tr>

                @if (comparedServices().length > 0) {
                  <tr class="bg-slate-50/70">
                    <th
                      scope="row"
                      class="py-2 pr-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-slate-600"
                    >
                      {{ i18n.t('compare.services') }}
                    </th>
                    <td [attr.colspan]="beaches().length" class="py-2 pl-3"></td>
                  </tr>
                  @for (service of comparedServices(); track service) {
                    <tr>
                      <th scope="row" class="py-2.5 pl-3 pr-3 text-xs font-medium text-slate-600">
                        {{ service }}
                      </th>
                      @for (beach of beaches(); track beach.id) {
                        <td class="py-2.5 pl-3 text-xs">
                          @if (hasService(beach, service)) {
                            <span
                              class="inline-flex items-center gap-1 font-medium text-emerald-700"
                            >
                              <span aria-hidden="true">✓</span> {{ i18n.t('compare.yes') }}
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1 text-slate-500">
                              <span aria-hidden="true">—</span> {{ i18n.t('compare.no') }}
                            </span>
                          }
                        </td>
                      }
                    </tr>
                  }
                } @else {
                  <tr>
                    <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                      {{ i18n.t('compare.services') }}
                    </th>
                    <td [attr.colspan]="beaches().length" class="py-3 pl-3 text-xs text-slate-500">
                      {{ i18n.t('compare.noneHaveServices') }}
                    </td>
                  </tr>
                }

                <tr>
                  <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                    {{ i18n.t('compare.latestSample') }}
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <td class="py-3 pl-3 text-slate-700">{{ sampleDate(beach) }}</td>
                  }
                </tr>

                <tr>
                  <th scope="row" class="py-3 pr-3 text-xs font-semibold text-slate-600">
                    {{ i18n.t('compare.actions') }}
                  </th>
                  @for (beach of beaches(); track beach.id) {
                    <td class="py-3 pl-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          class="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                          (click)="selected.emit(beach)"
                        >
                          {{ i18n.t('compare.viewOnMap') }}
                        </button>
                        <a
                          [href]="mapsUrl(beach)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          {{ i18n.t('detail.directions') }}
                        </a>
                      </div>
                    </td>
                  }
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Vista móvil (< 768 px): tarjetas apiladas sin scroll horizontal -->
          <div class="space-y-3 md:hidden" data-testid="compare-cards">
            @for (beach of beaches(); track beach.id) {
              <article
                class="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                [attr.data-testid]="'compare-card-' + beach.id"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h3 class="text-base font-semibold tracking-tight text-slate-900">
                      {{ beach.name }}
                    </h3>
                    <p class="text-xs text-slate-600">
                      {{ beach.municipality }} · {{ islandLabel(beach.island) }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    [attr.aria-label]="i18n.t('results.removeCompare', { name: beach.name })"
                    [attr.data-testid]="'compare-card-remove-' + beach.id"
                    (click)="removed.emit(beach.id)"
                  >
                    {{ i18n.t('compare.remove') }}
                  </button>
                </div>

                <dl class="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <dt class="font-semibold text-slate-600">
                      {{ i18n.t('compare.waterQuality') }}
                    </dt>
                    <dd class="mt-0.5 flex items-center gap-1.5 font-medium text-slate-800">
                      <span
                        class="h-2 w-2 shrink-0 rounded-full"
                        [style.background-color]="qualityColor(beach.quality)"
                        aria-hidden="true"
                      ></span>
                      {{ qualityLabel(beach.quality) }}
                    </dd>
                  </div>

                  <div>
                    <dt class="font-semibold text-slate-600">{{ i18n.t('compare.trend') }}</dt>
                    <dd class="mt-0.5">
                      <span [class]="trendClass(beach)">{{ trendLabel(beach) }}</span>
                    </dd>
                  </div>

                  <div>
                    <dt class="font-semibold text-slate-600">{{ i18n.t('compare.blueFlag') }}</dt>
                    <dd class="mt-0.5 font-medium text-slate-800">
                      @if (beach.blueFlag) {
                        {{ i18n.t('compare.yes')
                        }}{{ beach.blueFlagYear ? ' (' + beach.blueFlagYear + ')' : '' }}
                      } @else {
                        {{ i18n.t('compare.no') }}
                      }
                    </dd>
                  </div>

                  <div>
                    <dt class="font-semibold text-slate-600">
                      {{ i18n.t('compare.accessibility') }}
                    </dt>
                    <dd class="mt-0.5 font-medium text-slate-800">
                      {{ accessibilityLabel(beach) }}
                    </dd>
                  </div>

                  <div>
                    <dt class="font-semibold text-slate-600">
                      {{ i18n.t('compare.latestSample') }}
                    </dt>
                    <dd class="mt-0.5 font-medium text-slate-800">{{ sampleDate(beach) }}</dd>
                  </div>

                  @if (userLocation()) {
                    <div>
                      <dt class="font-semibold text-slate-600">
                        {{ i18n.t('compare.distance') }}
                      </dt>
                      <dd class="mt-0.5 font-medium text-sea-700">
                        {{ i18n.t('results.distanceAway', { distance: distanceLabel(beach) }) }}
                      </dd>
                    </div>
                  }
                </dl>

                <div class="mt-3 border-t border-slate-200/70 pt-3">
                  <p
                    class="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-slate-600"
                  >
                    {{ i18n.t('compare.services') }}
                  </p>
                  <div class="mt-1.5 flex flex-wrap gap-1.5">
                    @for (service of beach.services; track service) {
                      <span
                        class="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {{ service }}
                      </span>
                    } @empty {
                      <span class="text-xs text-slate-600">{{ i18n.t('compare.noServices') }}</span>
                    }
                  </div>
                </div>

                <div
                  class="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-3"
                >
                  <button
                    type="button"
                    class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                    (click)="selected.emit(beach)"
                  >
                    {{ i18n.t('compare.viewOnMap') }}
                  </button>
                  <a
                    [href]="mapsUrl(beach)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {{ i18n.t('detail.directions') }}
                  </a>
                </div>
              </article>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BeachCompare implements OnInit {
  readonly beaches = input.required<Beach[]>();
  readonly shareUrl = input('');
  readonly userLocation = input<Coordinates | null>(null);

  readonly removed = output<string>();
  readonly cleared = output<void>();
  readonly selected = output<Beach>();
  readonly closed = output<void>();

  readonly i18n = inject(TranslationService);
  readonly maxCompareBeaches = MAX_COMPARE_BEACHES;

  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogPanel = viewChild<ElementRef<HTMLElement>>('dialogPanel');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  readonly shareState = signal<'idle' | 'copied' | 'error'>('idle');
  private shareTimer?: ReturnType<typeof setTimeout>;

  readonly comparedServices = computed(() => getAvailableServices(this.beaches()));

  readonly shareStatusClass = computed(
    () =>
      `border-b border-slate-100 px-4 py-2 text-xs font-medium sm:px-6 ${
        this.shareState() === 'error'
          ? 'bg-rose-50 text-rose-700'
          : 'bg-emerald-50 text-emerald-700'
      }`,
  );

  constructor() {
    afterNextRender(() => {
      this.closeButton()?.nativeElement.focus();
    });

    this.destroyRef.onDestroy(() => clearTimeout(this.shareTimer));
  }

  ngOnInit(): void {
    this.analytics.track('compare_open', {
      count: this.beaches().length,
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }

    if (event.key !== 'Tab') return;

    const panel = this.dialogPanel()?.nativeElement;
    if (!panel || typeof document === 'undefined') return;

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null,
    );

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (!active || active === last || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  async share(): Promise<void> {
    const url = this.shareUrl();
    if (!url) return;

    const names = this.beaches()
      .map((beach) => beach.name)
      .join(' vs ');
    const data = {
      title: this.i18n.t('compare.shareTitle', { names }),
      text: this.i18n.t('compare.shareText', { names }),
      url,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        this.analytics.track('share', {
          target: 'compare',
          count: this.beaches().length,
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
        target: 'compare',
        count: this.beaches().length,
        method: 'clipboard',
      });
    } catch {
      this.setShareState('error');
    }
  }

  qualityLabel(quality: WaterQuality): string {
    return this.i18n.qualityLabel(quality);
  }

  qualityColor(quality: WaterQuality): string {
    return QUALITY_COLORS[quality];
  }

  islandLabel(islandId: Beach['island']): string {
    return this.i18n.islandLabel(islandId);
  }

  accessibilityLabel(beach: Beach): string {
    return this.i18n.accessibilityLabel(getBeachAccessibility(beach));
  }

  hasService(beach: Beach, service: ServiceId): boolean {
    return beach.services.includes(service);
  }

  distanceLabel(beach: Beach): string {
    const location = this.userLocation();
    return location ? this.i18n.formatDistance(distanceKm(location, beach)) : '';
  }

  sampleDate(beach: Beach): string {
    if (!beach.lastSample) return this.i18n.qualityLabel('sin-datos');

    return this.i18n.formatDate(beach.lastSample);
  }

  mapsUrl(beach: Beach): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${beach.lat},${beach.lon}`;
  }

  trendLabel(beach: Beach): string {
    return this.i18n.trendLabel(this.getTrend(beach));
  }

  trendClass(beach: Beach): string {
    const base =
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold';

    switch (this.getTrend(beach)) {
      case 'mejora':
        return `${base} bg-emerald-50 text-emerald-700`;
      case 'empeora':
        return `${base} bg-rose-50 text-rose-700`;
      case 'estable':
        return `${base} bg-slate-100 text-slate-600`;
      default:
        return `${base} bg-slate-100 text-slate-600`;
    }
  }

  private getTrend(beach: Beach): QualityTrend {
    return getSamplesTrend(getBeachSamples(beach));
  }

  private setShareState(state: 'copied' | 'error'): void {
    this.shareState.set(state);
    clearTimeout(this.shareTimer);
    this.shareTimer = setTimeout(() => this.shareState.set('idle'), 2500);
  }
}
