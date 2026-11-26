import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
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

  readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly island = signal<IslandFilter>(this.readIsland());
  readonly quality = signal<QualityFilter>(this.readQuality());
  readonly blueFlag = signal(this.route.snapshot.queryParamMap.get('bandera') === '1');
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
    'group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition';
  private readonly itemActive = 'bg-sky-50 ring-1 ring-sky-200';
  private readonly itemIdle = 'hover:bg-slate-50';

  readonly filteredBeaches = computed(() =>
    filterBeaches(BEACHES, {
      query: this.query(),
      island: this.island(),
      quality: this.quality(),
      blueFlag: this.blueFlag(),
    })
  );

  readonly selectedBeach = computed(() => {
    const id = this.selectedId();
    return id ? (BEACHES.find((beach) => beach.id === id) ?? null) : null;
  });

  readonly hasFilters = computed(
    () =>
      this.query().trim().length > 0 ||
      this.island() !== 'todas' ||
      this.quality() !== 'todas' ||
      this.blueFlag()
  );

  constructor() {
    effect(() => {
      const queryParams: Record<string, string | null> = {
        q: this.query().trim() || null,
        isla: this.island() === 'todas' ? null : this.island(),
        calidad: this.quality() === 'todas' ? null : this.quality(),
        bandera: this.blueFlag() ? '1' : null,
        playa: this.selectedId(),
      };

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true,
      });
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

  private readIsland(): IslandFilter {
    const value = this.route.snapshot.queryParamMap.get('isla');
    return value && ISLAND_IDS.has(value) ? (value as IslandId) : 'todas';
  }

  private readQuality(): QualityFilter {
    const value = this.route.snapshot.queryParamMap.get('calidad');
    return value && QUALITY_IDS.has(value) ? (value as WaterQuality) : 'todas';
  }
}
