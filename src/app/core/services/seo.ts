import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslationService } from '../i18n/translation.service';
import { Beach } from '../models/beach';

export const SITE_URL = 'https://costa-clara-k23.pages.dev';
export const HOME_URL = `${SITE_URL}/`;
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
export const BEACH_JSONLD_ID = 'beach-jsonld';

export const DEFAULT_TITLE = 'Costa Clara · Playas de Baleares';
export const DEFAULT_DESCRIPTION =
  'Mapa interactivo de las playas de Baleares: calidad del agua, servicios, bandera azul y cómo llegar.';

export interface BeachJsonLd {
  '@context': 'https://schema.org';
  '@type': ['TouristAttraction', 'Beach'];
  name: string;
  description: string;
  url: string;
  image: string;
  geo: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  address: {
    '@type': 'PostalAddress';
    addressLocality: string;
    addressRegion: 'Illes Balears';
    addressCountry: 'ES';
  };
  isAccessibleForFree: true;
  publicAccess: true;
}

export function buildBeachUrl(beachId: string): string {
  return `${HOME_URL}?playa=${encodeURIComponent(beachId)}`;
}

export function buildBeachJsonLd(beach: Beach): BeachJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', 'Beach'],
    name: beach.name,
    description: beach.description,
    url: buildBeachUrl(beach.id),
    image: OG_IMAGE_URL,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: beach.lat,
      longitude: beach.lon,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: beach.municipality,
      addressRegion: 'Illes Balears',
      addressCountry: 'ES',
    },
    isAccessibleForFree: true,
    publicAccess: true,
  };
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly i18n = inject(TranslationService);

  update(beach: Beach | null): void {
    if (!beach) {
      this.setHome();
      return;
    }

    this.setBeach(beach);
  }

  setHome(): void {
    const homeTitle = this.i18n.t('seo.homeTitle');
    const homeDescription = this.i18n.t('seo.homeDescription');

    this.title.setTitle(homeTitle);
    this.meta.updateTag({ name: 'description', content: homeDescription });
    this.meta.updateTag({ property: 'og:title', content: homeTitle });
    this.meta.updateTag({ property: 'og:description', content: homeDescription });
    this.meta.updateTag({ property: 'og:url', content: HOME_URL });
    this.setCanonical(HOME_URL);
    this.clearBeachJsonLd();
  }

  setBeach(beach: Beach): void {
    const islandLabel = this.i18n.islandLabel(beach.island);
    const quality = this.i18n.qualityLabel(beach.quality).toLowerCase();
    const description = this.i18n.t('seo.beachDescription', {
      name: beach.name,
      island: islandLabel,
      municipality: beach.municipality,
      quality,
    });
    const beachTitle = this.i18n.t('seo.beachTitle', { name: beach.name });
    const url = buildBeachUrl(beach.id);

    this.title.setTitle(beachTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: beachTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.setCanonical(url);
    this.setBeachJsonLd(buildBeachJsonLd(beach));
  }

  clearBeachJsonLd(): void {
    this.document.getElementById(BEACH_JSONLD_ID)?.remove();
  }

  private setCanonical(href: string): void {
    const head = this.document.head;
    if (!head) return;

    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.setAttribute('href', href);
  }

  private setBeachJsonLd(data: BeachJsonLd): void {
    const head = this.document.head;
    if (!head) return;

    let script = this.document.getElementById(BEACH_JSONLD_ID) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = BEACH_JSONLD_ID;
      script.type = 'application/ld+json';
      head.appendChild(script);
    }

    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}
