import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BEACHES, DATA_STATUS } from '../../core/data/beaches';
import {
  Beach,
  ISLANDS,
  IslandId,
  QUALITY_COLORS,
  QUALITY_LABELS,
  ServiceId,
  WaterQuality,
} from '../../core/models/beach';
import {
  ACCESSIBILITY_LABELS,
  AccessibilityFilter,
  BeachFilters,
  BeachSort,
  MAX_COMPARE_BEACHES,
  SERVICE_SLUGS,
  compareIdsToParam,
  countByAccessibility,
  countByIsland,
  countByQuality,
  countByService,
  filterBeaches,
  getAvailableAccessibilityLevels,
  getAvailableServices,
  parseAccessibilityParam,
  parseCompareIds,
  parseServicesParam,
  parseSortParam,
  servicesToParam,
  sortBeaches,
} from '../../core/utils/beach-filter';
import { Coordinates, distanceKm, formatDistance } from '../../core/utils/geo';
import { AnalyticsService } from '../../core/services/analytics';
import { FavoritesStore } from '../../core/services/favorites';
import { SeoService } from '../../core/services/seo';
import { BeachCompare } from './beach-compare';
import { BeachDetail } from './beach-detail';
import { BeachMap } from './beach-map';

type IslandFilter = IslandId | 'todas';
type QualityFilter = WaterQuality | 'todas';

const ISLAND_IDS = new Set<string>(ISLANDS.map((island) => island.id));
const QUALITY_IDS = new Set<string>(Object.keys(QUALITY_LABELS));
const VALID_BEACH_IDS = new Set<string>(BEACHES.map((beach) => beach.id));
const SEARCH_DEBOUNCE_MS = 250;
const COMPARE_WARNING_MS = 3500;

@Component({
  selector: 'app-beaches-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BeachMap, BeachDetail, BeachCompare],
  templateUrl: './beaches-page.html',
  styleUrl: './beaches-page.scss',
})
export class BeachesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  readonly favorites = inject(FavoritesStore);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dataStatus = DATA_STATUS;

  readonly mapSection = viewChild<ElementRef<HTMLElement>>('mapSection');
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly openCompareButton = viewChild<ElementRef<HTMLButtonElement>>('openCompareButton');

  readonly userLocation = signal<Coordinates | null>(null);
  readonly locationStatus = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
  readonly isFullscreen = signal(false);
  readonly legendOpen = signal(
    typeof window === 'undefined' || !window.matchMedia('(max-width: 639px)').matches,
  );

  readonly availableServices = getAvailableServices(BEACHES);
  readonly availableAccessibility = getAvailableAccessibilityLevels(BEACHES);

  private readonly initialQuery = this.route.snapshot.queryParamMap.get('q') ?? '';
  private readonly initialServices = parseServicesParam(
    this.route.snapshot.queryParamMap.get('servicios'),
    this.availableServices,
  );
  private readonly initialAccessibility = parseAccessibilityParam(
    this.route.snapshot.queryParamMap.get('accesibilidad'),
    this.availableAccessibility,
  );
  private readonly initialCompareIds = parseCompareIds(
    this.route.snapshot.queryParamMap.get('comparar'),
    VALID_BEACH_IDS,
  );

  readonly queryInput = signal(this.initialQuery);
  readonly query = signal(this.initialQuery);
  readonly island = signal<IslandFilter>(this.readIsland());
  readonly quality = signal<QualityFilter>(this.readQuality());
  readonly blueFlag = signal(this.route.snapshot.queryParamMap.get('bandera') === '1');
  readonly showFavoritesOnly = signal(this.route.snapshot.queryParamMap.get('favoritas') === '1');
  readonly selectedServices = signal<ServiceId[]>(this.initialServices);
  readonly accessibility = signal<AccessibilityFilter>(this.initialAccessibility);
  readonly advancedOpen = signal(
    this.initialServices.length > 0 || this.initialAccessibility !== 'todas',
  );
  readonly sortBy = signal<BeachSort>(
    parseSortParam(this.route.snapshot.queryParamMap.get('orden')),
  );
  readonly selectedId = signal<string | null>(this.route.snapshot.queryParamMap.get('playa'));
  readonly compareIds = signal<string[]>(this.initialCompareIds);
  readonly compareOpen = signal(this.initialCompareIds.length >= 2);
  readonly compareWarning = signal<string | null>(null);
  readonly compareAnnouncement = signal('');

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;
  private compareWarningTimer?: ReturnType<typeof setTimeout>;

  readonly islandOptions: ReadonlyArray<{ id: IslandFilter; label: string }> = [
    { id: 'todas', label: 'Todas' },
    ...ISLANDS,
  ];

  readonly qualityOptions: ReadonlyArray<{ id: QualityFilter; label: string }> = [
    { id: 'todas', label: 'Todas' },
    ...Object.entries(QUALITY_LABELS).map(([id, label]) => ({
      id: id as WaterQuality,
      label,
    })),
  ];

  readonly sortOptions = computed<ReadonlyArray<{ id: BeachSort; label: string }>>(() => [
    { id: 'nombre', label: 'Orden: Nombre (A–Z)' },
    { id: 'calidad', label: 'Orden: Mejor calidad' },
    { id: 'muestra', label: 'Orden: Muestra más reciente' },
    { id: 'isla', label: 'Orden: Isla (A–Z)' },
    ...(this.userLocation() ? [{ id: 'distancia' as const, label: 'Orden: Más cercanas' }] : []),
  ]);

  readonly qualityLegend = Object.entries(QUALITY_LABELS).map(([id, label]) => ({
    id: id as WaterQuality,
    label,
    color: QUALITY_COLORS[id as WaterQuality],
  }));

  private readonly pillBase = 'rounded-full px-3 py-1.5 text-xs font-semibold transition';
  private readonly pillActive = 'bg-slate-900 text-white shadow-sm';
  private readonly pillIdle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  private readonly pillMuted =
    'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100';
  private readonly itemBase =
    'group flex w-full items-center gap-1 rounded-xl transition focus-within:ring-2 focus-within:ring-sea-400';
  private readonly itemActive = 'bg-sky-50 ring-1 ring-sky-200';
  private readonly itemIdle = 'hover:bg-slate-50';
  private readonly favoritesPillBase =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition';
  private readonly actionIconBase = 'grid h-8 w-8 place-items-center rounded-full transition';

  private readonly currentFilters = computed<BeachFilters>(() => ({
    query: this.query(),
    island: this.island(),
    quality: this.quality(),
    blueFlag: this.blueFlag(),
    services: this.selectedServices(),
    accessibility: this.accessibility(),
  }));

  private readonly favoriteScopedBeaches = computed(() =>
    this.showFavoritesOnly()
      ? BEACHES.filter((beach) => this.favorites.isFavorite(beach.id))
      : BEACHES,
  );

  readonly filteredBeaches = computed(() => {
    const filtered = filterBeaches(this.favoriteScopedBeaches(), this.currentFilters());
    return sortBeaches(filtered, this.sortBy(), this.userLocation());
  });

  readonly islandCounts = computed(() =>
    countByIsland(this.favoriteScopedBeaches(), this.currentFilters()),
  );

  readonly qualityCounts = computed(() =>
    countByQuality(this.favoriteScopedBeaches(), this.currentFilters()),
  );

  readonly serviceCounts = computed(() =>
    countByService(this.favoriteScopedBeaches(), this.currentFilters(), this.availableServices),
  );

  readonly accessibilityCounts = computed(() =>
    countByAccessibility(this.favoriteScopedBeaches(), this.currentFilters()),
  );

  readonly activeAdvancedCount = computed(
    () => this.selectedServices().length + (this.accessibility() !== 'todas' ? 1 : 0),
  );

  readonly hasNonQueryFilters = computed(
    () =>
      this.island() !== 'todas' ||
      this.quality() !== 'todas' ||
      this.blueFlag() ||
      this.showFavoritesOnly() ||
      this.selectedServices().length > 0 ||
      this.accessibility() !== 'todas',
  );

  readonly hasFilters = computed(() => this.query().trim().length > 0 || this.hasNonQueryFilters());

  readonly selectedBeach = computed(() => {
    const id = this.selectedId();
    return id ? (BEACHES.find((beach) => beach.id === id) ?? null) : null;
  });

  readonly comparedBeaches = computed(() =>
    this.compareIds()
      .map((id) => BEACHES.find((beach) => beach.id === id))
      .filter((beach): beach is Beach => beach !== undefined),
  );

  readonly isCompareFull = computed(() => this.compareIds().length >= MAX_COMPARE_BEACHES);

  readonly shareUrl = computed(() => {
    if (typeof window === 'undefined') return '';

    const url = new URL(window.location.origin + window.location.pathname);
    const query = this.query().trim();
    const beach = this.selectedBeach();
    const services = servicesToParam(this.selectedServices());
    const sort = this.sortBy();
    const compare = compareIdsToParam(this.compareIds());

    if (query) url.searchParams.set('q', query);
    if (this.island() !== 'todas') url.searchParams.set('isla', this.island());
    if (this.quality() !== 'todas') url.searchParams.set('calidad', this.quality());
    if (this.blueFlag()) url.searchParams.set('bandera', '1');
    if (services) url.searchParams.set('servicios', services);
    if (this.accessibility() !== 'todas') {
      url.searchParams.set('accesibilidad', this.accessibility());
    }
    if (sort !== 'nombre' && sort !== 'distancia') url.searchParams.set('orden', sort);
    // Las favoritas son locales: no se incluyen en el enlace compartido.
    if (beach) url.searchParams.set('playa', beach.id);
    if (compare) url.searchParams.set('comparar', compare);

    return url.toString();
  });

  constructor() {
    const onFullscreenChange = (): void => {
      this.isFullscreen.set(typeof document !== 'undefined' && document.fullscreenElement !== null);
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', onFullscreenChange);
      this.destroyRef.onDestroy(() =>
        document.removeEventListener('fullscreenchange', onFullscreenChange),
      );
    }

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.searchDebounceTimer);
      clearTimeout(this.compareWarningTimer);
      this.seo.clearBeachJsonLd();
    });

    effect(() => {
      const queryParams: Record<string, string | null> = {
        q: this.query().trim() || null,
        isla: this.island() === 'todas' ? null : this.island(),
        calidad: this.quality() === 'todas' ? null : this.quality(),
        bandera: this.blueFlag() ? '1' : null,
        favoritas: this.showFavoritesOnly() ? '1' : null,
        servicios: servicesToParam(this.selectedServices()),
        accesibilidad: this.accessibility() === 'todas' ? null : this.accessibility(),
        orden: this.sortBy() === 'nombre' ? null : this.sortBy(),
        playa: this.selectedId(),
        comparar: compareIdsToParam(this.compareIds()),
      };

      const current = this.route.snapshot.queryParamMap;
      const unchanged = Object.entries(queryParams).every(
        ([key, value]) => (current.get(key) ?? null) === value,
      );

      if (unchanged) return;

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true,
      });
    });

    effect(() => {
      this.seo.update(this.selectedBeach());
    });
  }

  onQueryInput(value: string): void {
    this.queryInput.set(value);
    clearTimeout(this.searchDebounceTimer);

    if (value.trim() === '') {
      this.query.set('');
      return;
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.applySearch(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.queryInput().length > 0) {
      event.preventDefault();
      this.clearSearch();
    } else if (event.key === 'Enter') {
      this.flushSearch();
    }
  }

  clearSearch(): void {
    clearTimeout(this.searchDebounceTimer);
    this.queryInput.set('');
    this.query.set('');
    this.searchInput()?.nativeElement.focus();
  }

  flushSearch(): void {
    clearTimeout(this.searchDebounceTimer);
    this.applySearch(this.queryInput());
  }

  setIsland(value: string): void {
    if ((value === 'todas' || ISLAND_IDS.has(value)) && value !== this.island()) {
      this.island.set(value as IslandFilter);
      this.analytics.track('filter', {
        type: 'island',
        value,
        results: this.filteredBeaches().length,
      });
    }
  }

  setQuality(value: string): void {
    if ((value === 'todas' || QUALITY_IDS.has(value)) && value !== this.quality()) {
      this.quality.set(value as QualityFilter);
      this.analytics.track('filter', {
        type: 'quality',
        value,
        results: this.filteredBeaches().length,
      });
    }
  }

  setSort(value: string): void {
    if (value === 'distancia') {
      if (this.userLocation()) {
        this.sortBy.set('distancia');
      }
      return;
    }

    this.sortBy.set(parseSortParam(value));
  }

  toggleBlueFlag(): void {
    const active = !this.blueFlag();
    this.blueFlag.set(active);
    this.analytics.track('filter', {
      type: 'blue_flag',
      active,
      results: this.filteredBeaches().length,
    });
  }

  toggleAdvancedFilters(): void {
    this.advancedOpen.update((open) => !open);
  }

  toggleService(service: ServiceId): void {
    const active = !this.selectedServices().includes(service);
    this.selectedServices.update((current) => {
      const next = current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service];
      return this.availableServices.filter((item) => next.includes(item));
    });
    this.analytics.track('filter', {
      type: 'service',
      value: SERVICE_SLUGS[service],
      active,
      results: this.filteredBeaches().length,
    });
  }

  isServiceSelected(service: ServiceId): boolean {
    return this.selectedServices().includes(service);
  }

  setAccessibility(level: AccessibilityFilter): void {
    if (this.availableAccessibility.includes(level) && level !== this.accessibility()) {
      this.accessibility.set(level);
      this.analytics.track('filter', {
        type: 'accessibility',
        value: level,
        results: this.filteredBeaches().length,
      });
    }
  }

  toggleFavoritesFilter(): void {
    const active = !this.showFavoritesOnly();
    this.showFavoritesOnly.set(active);
    this.analytics.track('filter', {
      type: 'favorites',
      active,
      results: this.filteredBeaches().length,
    });
  }

  showAllBeaches(): void {
    if (!this.showFavoritesOnly()) return;
    this.showFavoritesOnly.set(false);
    this.analytics.track('filter', {
      type: 'favorites',
      active: false,
      results: this.filteredBeaches().length,
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites.isFavorite(id);
  }

  toggleFavorite(beach: Beach): void {
    this.favorites.toggle(beach.id);
    this.analytics.track('favorite', {
      beach: beach.id,
      active: this.favorites.isFavorite(beach.id),
    });
  }

  isCompared(id: string): boolean {
    return this.compareIds().includes(id);
  }

  toggleCompare(beach: Beach): void {
    if (this.isCompared(beach.id)) {
      this.removeFromCompare(beach.id);
      return;
    }

    if (this.compareIds().length >= MAX_COMPARE_BEACHES) {
      const message = 'Máximo 3 playas a la vez. Quita una para añadir otra.';
      this.compareWarning.set(message);
      this.compareAnnouncement.set(message);
      clearTimeout(this.compareWarningTimer);
      this.compareWarningTimer = setTimeout(
        () => this.compareWarning.set(null),
        COMPARE_WARNING_MS,
      );
      return;
    }

    this.compareWarning.set(null);
    clearTimeout(this.compareWarningTimer);
    this.compareIds.update((ids) => [...ids, beach.id]);
    this.compareAnnouncement.set(
      `Añadida ${beach.name} al comparador (${this.compareIds().length} de ${MAX_COMPARE_BEACHES}).`,
    );
  }

  removeFromCompare(id: string): void {
    const beach = BEACHES.find((item) => item.id === id);
    const next = this.compareIds().filter((item) => item !== id);
    const wasOpen = this.compareOpen();

    this.compareWarning.set(null);
    clearTimeout(this.compareWarningTimer);
    this.compareIds.set(next);

    if (wasOpen && next.length < 2) {
      this.compareOpen.set(false);
      this.compareAnnouncement.set(
        next.length === 1
          ? 'Queda 1 playa en el comparador. Añade otra para comparar.'
          : 'Comparador vaciado.',
      );
      if (next.length === 1 && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => this.openCompareButton()?.nativeElement.focus());
      }
      return;
    }

    if (beach) {
      this.compareAnnouncement.set(`Quitada ${beach.name} del comparador.`);
    }
  }

  clearCompare(): void {
    this.compareIds.set([]);
    this.compareOpen.set(false);
    this.compareWarning.set(null);
    clearTimeout(this.compareWarningTimer);
    this.compareAnnouncement.set('Comparador vaciado.');
  }

  openCompare(): void {
    if (this.comparedBeaches().length >= 2) {
      this.compareOpen.set(true);
    }
  }

  closeCompare(): void {
    this.compareOpen.set(false);
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => this.openCompareButton()?.nativeElement.focus());
    }
  }

  selectFromCompare(beach: Beach): void {
    this.compareOpen.set(false);
    this.selectBeach(beach);
  }

  selectBeach(beach: Beach): void {
    this.selectedId.set(beach.id);

    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 1023px)').matches) {
      return;
    }

    requestAnimationFrame(() => {
      this.mapSection()?.nativeElement.scrollIntoView({
        behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  selectBeachFromMap(beach: Beach): void {
    this.selectedId.set(beach.id);

    if (typeof document === 'undefined') return;

    requestAnimationFrame(() => {
      document.getElementById(`beach-item-${beach.id}`)?.scrollIntoView({
        behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'nearest',
      });
    });
  }

  requestLocation(): void {
    if (this.locationStatus() === 'loading') return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.locationStatus.set('error');
      return;
    }

    this.locationStatus.set('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation.set({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
        });
        this.sortBy.set('distancia');
        this.locationStatus.set('ready');
      },
      () => this.locationStatus.set('error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  distanceLabel(beach: Beach): string | null {
    const location = this.userLocation();
    return location ? formatDistance(distanceKm(location, beach)) : null;
  }

  toggleLegend(): void {
    this.legendOpen.update((value) => !value);
  }

  async toggleFullscreen(): Promise<void> {
    const section = this.mapSection()?.nativeElement;
    if (!section || typeof document === 'undefined') return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await section.requestFullscreen();
      }
    } catch {
      // Algunos navegadores bloquean la API; la vista sigue funcionando.
    }
  }

  closeDetail(): void {
    const id = this.selectedId();
    this.selectedId.set(null);

    if (!id || typeof requestAnimationFrame === 'undefined') return;

    requestAnimationFrame(() => {
      const row = document.getElementById(`beach-item-${id}`)?.querySelector<HTMLElement>('button');
      (row ?? this.searchInput()?.nativeElement)?.focus();
    });
  }

  clearFilters(): void {
    const hadFilters = this.hasFilters();
    clearTimeout(this.searchDebounceTimer);
    this.queryInput.set('');
    this.query.set('');
    this.island.set('todas');
    this.quality.set('todas');
    this.blueFlag.set(false);
    this.showFavoritesOnly.set(false);
    this.selectedServices.set([]);
    this.accessibility.set('todas');

    if (hadFilters) {
      this.analytics.track('filter', {
        type: 'clear',
        results: this.filteredBeaches().length,
      });
    }
  }

  qualityColor(quality: WaterQuality): string {
    return QUALITY_COLORS[quality];
  }

  qualityLabel(quality: WaterQuality): string {
    return QUALITY_LABELS[quality];
  }

  islandLabel(island: IslandId): string {
    return ISLANDS.find((item) => item.id === island)?.label ?? island;
  }

  accessibilityLabel(level: AccessibilityFilter): string {
    return ACCESSIBILITY_LABELS[level];
  }

  serviceSlug(service: ServiceId): string {
    return SERVICE_SLUGS[service];
  }

  pillClass(active: boolean, muted = false): string {
    const state = active ? this.pillActive : muted ? this.pillMuted : this.pillIdle;
    return `${this.pillBase} ${state}`;
  }

  serviceChipClass(active: boolean, muted = false): string {
    const base = 'rounded-full px-2.5 py-1 text-xs font-medium transition';
    if (active) return `${base} bg-sea-700 text-white shadow-xs`;
    const tone = muted ? 'bg-slate-50 text-slate-600' : 'bg-white text-slate-700';
    return `${base} border border-slate-200 ${tone} hover:border-slate-300 hover:bg-slate-100`;
  }

  beachItemClass(active: boolean): string {
    return `${this.itemBase} ${active ? this.itemActive : this.itemIdle}`;
  }

  favoritesPillClass(): string {
    const state = this.showFavoritesOnly()
      ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200';

    return `${this.favoritesPillBase} ${state}`;
  }

  compareButtonClass(active: boolean): string {
    if (active) {
      return `${this.actionIconBase} bg-sea-50 text-sea-700 ring-1 ring-sea-200`;
    }

    if (this.isCompareFull()) {
      return `${this.actionIconBase} text-slate-500 hover:bg-slate-100`;
    }

    return `${this.actionIconBase} text-slate-500 hover:bg-slate-100 hover:text-slate-700`;
  }

  favoriteButtonClass(active: boolean): string {
    const state = active
      ? 'text-rose-500 hover:bg-rose-50'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-600';

    return `${this.actionIconBase} ${state}`;
  }

  private applySearch(value: string): void {
    const trimmed = value.trim();
    const previous = this.query().trim();
    this.query.set(value);

    if (trimmed.length > 0 && trimmed !== previous) {
      this.analytics.track('search', {
        queryLength: trimmed.length,
        results: this.filteredBeaches().length,
      });
    }
  }

  private readIsland(): IslandFilter {
    const value = this.route.snapshot.queryParamMap.get('isla');
    return value && ISLAND_IDS.has(value) ? (value as IslandId) : 'todas';
  }

  private readQuality(): QualityFilter {
    const value = this.route.snapshot.queryParamMap.get('calidad');
    return value && QUALITY_IDS.has(value) ? (value as WaterQuality) : 'todas';
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
}
