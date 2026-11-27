import { Beach } from '../models/beach';

/**
 * Sitemap XML (CC-53).
 *
 * `buildSitemap` es pura: no toca el DOM ni el sistema de ficheros y devuelve
 * siempre el mismo XML para los mismos argumentos. Genera la home más una
 * entrada `/?playa=id` por cada playa.
 */

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

const HOME_PRIORITY = '1.0';
const BEACH_PRIORITY = '0.8';
const CHANGEFREQ = 'monthly';

export function buildSitemap(beaches: readonly Beach[], baseUrl: string, lastmod: string): string {
  const home = withTrailingSlash(baseUrl);

  const urls: SitemapUrl[] = [
    { loc: home, lastmod, changefreq: CHANGEFREQ, priority: HOME_PRIORITY },
    ...beaches.map((beach) => ({
      loc: `${home}?playa=${encodeURIComponent(beach.id)}`,
      lastmod,
      changefreq: CHANGEFREQ,
      priority: BEACH_PRIORITY,
    })),
  ];

  return renderSitemap(urls);
}

function withTrailingSlash(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function renderSitemap(urls: readonly SitemapUrl[]): string {
  const entries = urls
    .map(
      (url) =>
        `  <url>\n` +
        `    <loc>${escapeXml(url.loc)}</loc>\n` +
        `    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n` +
        `    <changefreq>${url.changefreq}</changefreq>\n` +
        `    <priority>${url.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${entries}\n` +
    `</urlset>\n`
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
