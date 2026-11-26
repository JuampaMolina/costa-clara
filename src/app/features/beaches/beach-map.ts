import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import Feature, { FeatureLike } from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control';
import ScaleLine from 'ol/control/ScaleLine';
import { createEmpty, extend } from 'ol/extent';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { Coordinate } from 'ol/coordinate';
import { Beach, QUALITY_COLORS } from '../../core/models/beach';
import { Coordinates } from '../../core/utils/geo';

type BasemapId = 'osm' | 'topo' | 'satellite';

const BASEMAP_STORAGE_KEY = 'costa-clara:basemap:v1';
const ANIMATION_MS = 450;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

@Component({
  selector: 'app-beach-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p id="map-help" class="sr-only">
      Usa la lista de resultados para recorrer las playas con el teclado. El mapa muestra la misma
      información.
    </p>

    <div
      #mapEl
      class="map"
      role="region"
      aria-label="Mapa de playas de Baleares"
      aria-describedby="map-help"
    ></div>

    <label class="absolute right-14 top-3 z-10">
      <span class="sr-only">Capa del mapa</span>
      <select
        class="rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur outline-none transition focus:border-sea-400 focus:ring-2 focus:ring-sea-100"
        (change)="setBasemap($any($event.target).value)"
      >
        <option value="osm" [selected]="basemap() === 'osm'">Mapa</option>
        <option value="topo" [selected]="basemap() === 'topo'">Relieve</option>
        <option value="satellite" [selected]="basemap() === 'satellite'">Satélite</option>
      </select>
    </label>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      height: 100%;
      min-height: 420px;
    }

    .map {
      height: 100%;
      width: 100%;
      background: #dbeafe;
    }

    .map:focus-visible {
      outline: 3px solid #0284c7;
      outline-offset: -3px;
    }
  `,
})
export class BeachMap implements AfterViewInit, OnDestroy {
  readonly beaches = input.required<Beach[]>();
  readonly selected = input<Beach | null>(null);
  readonly userLocation = input<Coordinates | null>(null);
  readonly beachSelected = output<Beach>();

  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private readonly mapReady = signal(false);

  readonly basemap = signal<BasemapId>(this.readBasemap());

  private map?: Map;
  private vectorSource?: VectorSource;
  private clusterSource?: Cluster;
  private vectorLayer?: VectorLayer<Cluster>;
  private userSource?: VectorSource;
  private resizeObserver?: ResizeObserver;
  private selectedId: string | null = null;

  private readonly tileLayers: Partial<Record<BasemapId, TileLayer>> = {};

  private readonly styleFn = (feature: FeatureLike): Style => {
    const features = feature.get('features') as Feature[] | undefined;
    const size = features?.length ?? 0;

    if (size > 1) {
      return new Style({
        image: new CircleStyle({
          radius: 15 + Math.min(size, 18),
          fill: new Fill({ color: 'rgba(2, 132, 199, 0.92)' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
        text: new Text({
          text: String(size),
          fill: new Fill({ color: '#ffffff' }),
          font: '600 12px ui-sans-serif, system-ui, sans-serif',
        }),
      });
    }

    const beach = features?.[0]?.get('beach') as Beach | undefined;
    const isSelected = beach?.id === this.selectedId;

    return new Style({
      image: new CircleStyle({
        radius: isSelected ? 10 : 8,
        fill: new Fill({ color: beach ? QUALITY_COLORS[beach.quality] : '#64748b' }),
        stroke: new Stroke({
          color: isSelected ? '#0f172a' : '#ffffff',
          width: isSelected ? 3 : 2.5,
        }),
      }),
      zIndex: isSelected ? 10 : 1,
    });
  };

  private readonly userStyle = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color: '#0284c7' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
  });

  constructor() {
    effect(() => {
      const beaches = this.beaches();
      if (!this.mapReady() || !this.vectorSource) return;

      this.vectorSource.clear();
      this.vectorSource.addFeatures(
        beaches.map((beach) => {
          const feature = new Feature({
            geometry: new Point(fromLonLat([beach.lon, beach.lat])),
            beach,
          });
          feature.setId(beach.id);
          return feature;
        }),
      );
    });

    effect(() => {
      const beach = this.selected();
      this.selectedId = beach?.id ?? null;
      this.vectorLayer?.changed();

      if (!this.mapReady() || !beach) return;

      this.moveView(fromLonLat([beach.lon, beach.lat]), 13.5);
    });

    effect(() => {
      const location = this.userLocation();
      if (!this.mapReady() || !this.userSource) return;

      this.userSource.clear();
      if (!location) return;

      const point = fromLonLat([location.lon, location.lat]);
      this.userSource.addFeature(new Feature({ geometry: new Point(point) }));
      this.moveView(point, 12);
    });
  }

  ngAfterViewInit(): void {
    const target = this.mapEl().nativeElement;

    this.vectorSource = new VectorSource();
    this.clusterSource = new Cluster({ distance: 42, source: this.vectorSource });
    this.vectorLayer = new VectorLayer({ source: this.clusterSource, style: this.styleFn });

    this.userSource = new VectorSource();
    const userLayer = new VectorLayer({
      source: this.userSource,
      style: this.userStyle,
      zIndex: 20,
    });

    this.tileLayers.osm = new TileLayer({
      source: new OSM(),
      visible: this.basemap() === 'osm',
    });
    this.tileLayers.topo = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        maxZoom: 17,
        attributions: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)',
      }),
      visible: this.basemap() === 'topo',
    });
    this.tileLayers.satellite = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
        attributions: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
      }),
      visible: this.basemap() === 'satellite',
    });

    this.map = new Map({
      target,
      layers: [
        this.tileLayers.osm,
        this.tileLayers.topo,
        this.tileLayers.satellite,
        this.vectorLayer,
        userLayer,
      ],
      controls: defaultControls({
        zoom: true,
        rotate: false,
        zoomOptions: { zoomInTipLabel: 'Acercar', zoomOutTipLabel: 'Alejar' },
        attributionOptions: { tipLabel: 'Atribuciones' },
      }).extend([new ScaleLine({ units: 'metric' })]),
      view: new View({
        center: fromLonLat([2.9, 39.55]),
        zoom: 8.4,
        minZoom: 7,
        maxZoom: 18,
      }),
    });

    this.map.on('singleclick', (event) => {
      this.map?.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          const features = feature.get('features') as Feature[] | undefined;
          if (!features?.length) return false;

          if (features.length === 1) {
            this.beachSelected.emit(features[0].get('beach') as Beach);
          } else {
            const extent = createEmpty();
            for (const item of features) {
              const geometry = item.getGeometry();
              if (geometry) extend(extent, geometry.getExtent());
            }
            this.map?.getView().fit(extent, {
              padding: [90, 90, 90, 90],
              duration: prefersReducedMotion() ? undefined : ANIMATION_MS,
              maxZoom: 14,
            });
          }
          return true;
        },
        { hitTolerance: 6 },
      );
    });

    this.map.on('pointermove', (event) => {
      const el = this.map?.getTargetElement();
      if (!el) return;
      el.style.cursor = this.map?.hasFeatureAtPixel(event.pixel) ? 'pointer' : '';
    });

    this.resizeObserver = new ResizeObserver(() => this.map?.updateSize());
    this.resizeObserver.observe(target);
    this.mapReady.set(true);
  }

  setBasemap(value: string): void {
    if (value !== 'osm' && value !== 'topo' && value !== 'satellite') return;

    this.basemap.set(value);

    for (const [id, layer] of Object.entries(this.tileLayers)) {
      layer?.setVisible(id === value);
    }

    try {
      localStorage.setItem(BASEMAP_STORAGE_KEY, value);
    } catch {
      // El mapa sigue funcionando sin persistir la preferencia.
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.setTarget(undefined);
  }

  private readBasemap(): BasemapId {
    if (typeof localStorage === 'undefined') return 'osm';

    const value = localStorage.getItem(BASEMAP_STORAGE_KEY);
    return value === 'topo' || value === 'satellite' ? value : 'osm';
  }

  private moveView(center: Coordinate, zoom: number): void {
    const view = this.map?.getView();
    if (!view) return;

    if (prefersReducedMotion()) {
      view.setCenter(center);
      view.setZoom(zoom);
      return;
    }

    view.animate({ center, zoom, duration: ANIMATION_MS });
  }
}
