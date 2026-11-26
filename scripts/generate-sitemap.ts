import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { BEACHES } from '../src/app/core/data/beaches';
import { Beach } from '../src/app/core/models/beach';
import { buildSitemap } from '../src/app/core/utils/sitemap';

/**
 * Regenera `public/sitemap.xml` a partir del dataset actual (CC-53).
 *
 * Uso directo:
 *   npm run sitemap:generate
 *   npm run sitemap:generate -- --date 2026-11-26 --base-url https://example.com
 *
 * También se importa desde `scripts/import-data.ts` para refrescar el sitemap
 * tras cada importación, sin ejecutar la rama de CLI.
 */

export const SITEMAP_BASE_URL = 'https://costa-clara-k23.pages.dev';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, 'public/sitemap.xml');

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function today(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function writeSitemap(
  beaches: readonly Beach[],
  options: { baseUrl?: string; lastmod?: string } = {},
): void {
  const baseUrl = options.baseUrl ?? SITEMAP_BASE_URL;
  const lastmod = options.lastmod ?? today();
  const xml = buildSitemap(beaches, baseUrl, lastmod);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, xml, 'utf8');
}

const isMain =
  typeof process.argv[1] === 'string' && process.argv[1].endsWith('generate-sitemap.ts');

if (isMain) {
  writeSitemap(BEACHES, {
    baseUrl: argument('base-url', SITEMAP_BASE_URL),
    lastmod: argument('date', today()),
  });
  console.log(`✓ sitemap regenerado con ${BEACHES.length} playas → ${outputPath}`);
}
