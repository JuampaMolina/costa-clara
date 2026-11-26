import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BEACHES } from '../../core/data/beaches.seed';
import {
  Beach,
  ISLANDS,
  IslandId,
  QUALITY_COLORS,
  QUALITY_LABELS,
  WaterQuality,
} from '../../core/models/beach';
import { filterBeaches } from '../../core/utils/beach-filter';
import { FavoritesStore } from '../../core/services/favorites';
import { BeachDetail } from './beach-detail';
import { BeachMap } from './beach-map';

type IslandFilter = IslandId | 'todas';
type QualityFilter = WaterQuality | 'todas';

const ISLAND_IDS = new Set<string>(ISLANDS.map((island) => island.id));
const QUALITY_IDS = new Set<string>(Object.keys(QUALITY_LABELS));

@Component({
  selector: 'app-beaches-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BeachMap, BeachDetail],
  templateUrl: './beaches-page.html',
  styleUrl: './beaches-page.scss',
})
export class BeachesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly favorites = inject(FavoritesStore);

  private readonly defaultTitle = 'Costa Clara · Playas de Baleares';
  private readonly defaultDescription =
    'Mapa interactivo de las playas de Baleares: calidad del agua, servicios, bandera azul y cómo llegar.';

  readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly island = signal<IslandFilter>(this.readIsland());
  readonly quality = signal<QualityFilter>(this.readQuality());
  readonly blueFlag = signal(this.route.snapshot.queryParamMap.get('bandera') === '1');
  readonly showFavoritesOnly = signal(
    this.route.snapshot.queryParamMap.get('favoritas') === '1'
  );
  readonly selectedId = signal<string | null>(this.route.snapshot.queryParamMap.get('playa'));

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

  readonly qualityLegend = Object.entries(QUALITY_LABELS).map(([id, label]) => ({
    id: id as WaterQuality,
    label,
    color: QUALITY_COLORS[id as WaterQuality],
  }));

  private readonly pillBase = 'rounded-full px-3 py-1.5 text-xs font-semibold transition';
  private readonly pillActive = 'bg-slate-900 text-white shadow-sm';
  private readonly pillIdle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  private readonly itemBase =
    'group flex w-full items-start gap-1 rounded-xl px-2 py-2.5 transition';
  private readonly itemActive = 'bg-sky-50 ring-1 ring-sky-200';
  private readonly itemIdle = 'hover:bg-slate-50';
  private readonly favoritesPillBase =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition';
  private readonly favoriteButtonBase = 'mt-0.5 shrink-0 rounded-full p-1.5 transition';

  readonly filteredBeaches = computed(() => {
    const beaches = filterBeaches(BEACHES, {
      query: this.query(),
      island: this.island(),
      quality: this.quality(),
      blueFlag: this.blueFlag(),
    });

    return this.showFavoritesOnly()
      ? beaches.filter((beach) => this.favorites.isFavorite(beach.id))
      : beaches;
  });

  readonly selectedBeach = computed(() => {
    const id = this.selectedId();
    return id ? (BEACHES.find((beach) => beach.id === id) ?? null) : null;
  });

  readonly hasFilters = computed(
    () =>
      this.query().trim().length > 0 ||
      this.island() !== 'todas' ||
      this.quality() !== 'todas' ||
      this.blueFlag() ||
      this.showFavoritesOnly()
  );

  readonly shareUrl = computed(() => {
    if (typeof window === 'undefined') return '';

    const url = new URL(window.location.origin + window.location.pathname);
    const query = this.query().trim();
    const beach = this.selectedBeach();

    if (query) url.searchParams.set('q', query);
    if (this.island() !== 'todas') url.searchParams.set('isla', this.island());
    if (this.quality() !== 'todas') url.searchParams.set('calidad', this.quality());
    if (this.blueFlag()) url.searchParams.set('bandera', '1');
    // Las favoritas son locales: no se incluyen en el enlace compartido.
    if (beach) url.searchParams.set('playa', beach.id);

    return url.toString();
  });

  constructor() {
    effect(() => {
      const queryParams: Record<string, string | null> = {
        q: this.query().trim() || null,
        isla: this.island() === 'todas' ? null : this.island(),
        calidad: this.quality() === 'todas' ? null : this.quality(),
        bandera: this.blueFlag() ? '1' : null,
        favoritas: this.showFavoritesOnly() ? '1' : null,
        playa: this.selectedId(),
      };

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true,
      });
    });

    effect(() => {
      const beach = this.selectedBeach();

      if (!beach) {
        this.title.setTitle(this.defaultTitle);
        this.meta.updateTag({ name: 'description', content: this.defaultDescription });
        this.meta.updateTag({ property: 'og:title', content: this.defaultTitle });
        this.meta.updateTag({ property: 'og:description', content: this.defaultDescription });
        return;
      }

      const quality = QUALITY_LABELS[beach.quality].toLowerCase();
      const description = `${beach.name} (${this.islandLabel(beach.island)}, ${beach.municipality}): calidad del agua ${quality}, servicios y cómo llegar.`;
      const beachTitle = `${beach.name} · Costa Clara`;

      this.title.setTitle(beachTitle);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: beachTitle });
      this.meta.updateTag({ property: 'og:description', content: description });
    });
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  setIsland(value: string): void {
    if (value === 'todas' || ISLAND_IDS.has(value)) {
      this.island.set(value as IslandFilter);
    }
  }

  setQuality(value: string): void {
    if (value === 'todas' || QUALITY_IDS.has(value)) {
      this.quality.set(value as QualityFilter);
    }
  }

  toggleBlueFlag(): void {
    this.blueFlag.update((value) => !value);
  }

  toggleFavoritesFilter(): void {
    this.showFavoritesOnly.update((value) => !value);
  }

  showAllBeaches(): void {
    this.showFavoritesOnly.set(false);
  }

  isFavorite(id: string): boolean {
    return this.favorites.isFavorite(id);
  }

  toggleFavorite(beach: Beach): void {
    this.favorites.toggle(beach.id);
  }

  selectBeach(beach: Beach): void {
    this.selectedId.set(beach.id);
  }

  closeDetail(): void {
    this.selectedId.set(null);
  }

  clearFilters(): void {
    this.query.set('');
    this.island.set('todas');
    this.quality.set('todas');
    this.blueFlag.set(false);
    this.showFavoritesOnly.set(false);
  }

  qualityColor(quality: WaterQuality): string {
    return QUALITY_COLORS[quality];
  }

  islandLabel(island: IslandId): string {
    return ISLANDS.find((item) => item.id === island)?.label ?? island;
  }

  pillClass(active: boolean): string {
    return `${this.pillBase} ${active ? this.pillActive : this.pillIdle}`;
  }

  beachItemClass(active: boolean): string {
    return `${this.itemBase} ${active ? this.itemActive : this.itemIdle}`;
  }

  favoritesPillClass(): string {
    const state = this.showFavoritesOnly()
      ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
      : 'bg-slate-100 text-slate-500 hover:bg-slate-200';

    return `${this.favoritesPillBase} ${state}`;
  }

  favoriteButtonClass(active: boolean): string {
    const state = active
      ? 'text-rose-500 hover:bg-rose-50'
      : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500';

    return `${this.favoriteButtonBase} ${state}`;
  }

  private readIsland(): IslandFilter {
    const value = this.route.snapshot.queryParamMap.get('isla');
    return value && ISLAND_IDS.has(value) ? (value as IslandId) : 'todas';
  }

  private readQuality(): QualityFilter {
    const value = this.route.snapshot.queryParamMap.get('calidad');
    return value && QUALITY_IDS.has(value) ? (value as WaterQuality) : 'todas';
  }
}
