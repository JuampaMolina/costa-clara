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
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { Beach, QUALITY_COLORS } from '../../core/models/beach';

@Component({
  selector: 'app-beach-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #mapEl class="map" role="application" aria-label="Mapa de playas de Baleares"></div>`,
  styles: `
    :host {
      display: block;
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
  readonly beachSelected = output<Beach>();

  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private readonly mapReady = signal(false);

  private map?: Map;
  private vectorSource?: VectorSource;
  private clusterSource?: Cluster;
  private resizeObserver?: ResizeObserver;

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
    return new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: beach ? QUALITY_COLORS[beach.quality] : '#64748b' }),
        stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
      }),
    });
  };

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
        })
      );
    });

    effect(() => {
      const beach = this.selected();
      if (!this.mapReady() || !beach) return;
      this.map?.getView().animate({
        center: fromLonLat([beach.lon, beach.lat]),
        zoom: 13.5,
        duration: 450,
      });
    });
  }

  ngAfterViewInit(): void {
    const target = this.mapEl().nativeElement;

    this.vectorSource = new VectorSource();
    this.clusterSource = new Cluster({ distance: 42, source: this.vectorSource });

    this.map = new Map({
      target,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: this.clusterSource, style: this.styleFn }),
      ],
      controls: defaultControls({ zoom: true, rotate: false }).extend([
        new ScaleLine({ units: 'metric' }),
      ]),
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
              duration: 450,
              maxZoom: 14,
            });
          }
          return true;
        },
        { hitTolerance: 6 }
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

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.setTarget(undefined);
  }
}
