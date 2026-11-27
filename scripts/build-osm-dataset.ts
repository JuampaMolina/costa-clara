/**
 * scripts/build-osm-dataset.ts — Genera el dataset OSM de playas de Baleares para la app.
 *
 * Lee el muestreo crudo de `data/raw/overpass/osm-beaches-all.json` (una sola consulta
 * Overpass, sin solape) y escribe `src/app/core/data/beaches-osm.generated.ts` con todas
 * las playas `natural=beach` que tienen nombre.
 *
 * El id de cada playa reutiliza el id del seed cuando coincide (por nombre OSM), y usa
 * `slug-<tipo><id>` en el resto. Calidad del agua en `sin-datos` (no se inventa); el
 * `dataStatus` es `sampled`.
 *
 * Uso: npx tsx scripts/build-osm-dataset.ts  (o `npm run data:osm`)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------- Configuración ----------

const ROOT = resolve(import.meta.dirname, '..');
const RAW_FILE = resolve(ROOT, 'data/raw/overpass/osm-beaches-all.json');
const OUT_FILE = resolve(ROOT, 'src/app/core/data/beaches-osm.generated.ts');

const UPDATED_AT = '2026-11-27';

const SOURCE = {
  name: 'OpenStreetMap',
  url: 'https://www.openstreetmap.org/copyright',
  license: 'ODbL 1.0',
};

// Isla por coordenadas (mismo criterio que el PoC).
function islandOf(lon: number, lat: number): string {
  if (lon >= 3.55) return 'menorca';
  if (lon < 1.75 && lat < 38.78) return 'formentera';
  if (lon < 1.75) return 'ibiza';
  return 'mallorca';
}

// Playas del seed que coinciden con OSM por nombre: id del seed -> nombre OSM.
// El municipio se toma del seed para esas playas; el resto usan "Baleares".
const SEED_OSM_MAP: ReadonlyArray<{ id: string; osmName: string; municipality: string }> = [
  { id: 'es-trenc', osmName: "Platja d'es Trenc", municipality: 'Campos' },
  { id: 'cala-varques', osmName: 'Cala Varques', municipality: 'Manacor' },
  {
    id: 'cala-millor',
    osmName: 'Platja de Cala Millor',
    municipality: 'Sant Llorenç des Cardassar',
  },
  { id: 'platja-de-palma', osmName: 'Platja de Palma', municipality: 'Palma' },
  { id: 'cala-macarella', osmName: 'Cala Macarella', municipality: 'Ciutadella de Menorca' },
  { id: 'son-bou', osmName: 'Son Bou', municipality: 'Alaior' },
  { id: 'cala-en-turqueta', osmName: 'Cala en Turqueta', municipality: 'Ciutadella de Menorca' },
  { id: 'punta-prima', osmName: 'Platja de Punta Prima', municipality: 'Sant Lluís' },
  { id: 'cala-comte', osmName: 'Platges de Comte', municipality: 'Sant Josep de sa Talaia' },
  { id: 'cala-dhort', osmName: "Cala d'Hort", municipality: 'Sant Josep de sa Talaia' },
  { id: 'platja-den-bossa', osmName: "Platja d'en Bossa", municipality: 'Sant Josep de sa Talaia' },
  { id: 'cala-salada', osmName: 'Cala Salada', municipality: 'Sant Antoni de Portmany' },
  { id: 'cala-saona', osmName: 'Platja cala Saona', municipality: 'Formentera' },
  { id: 'platja-de-migjorn', osmName: 'Platja de Migjorn', municipality: 'Formentera' },
];

// ---------- Tipos ----------

type OsmElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lon?: number;
  lat?: number;
  center?: { lon: number; lat: number };
  tags?: Record<string, string>;
};

// ---------- Utilidades ----------

function centerOf(el: OsmElement): { lon: number; lat: number } {
  return el.type === 'node'
    ? { lon: el.lon!, lat: el.lat! }
    : { lon: el.center!.lon, lat: el.center!.lat };
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'playa';
}

function mapServices(tags: Record<string, string>): string[] {
  const services: string[] = [];
  if (tags.lifeguard === 'yes' || tags.supervised === 'yes') services.push('Socorrista');
  if (tags.wheelchair === 'yes' || tags.wheelchair === 'limited') services.push('Acceso adaptado');
  return services;
}

function descriptionOf(tags: Record<string, string>): string {
  const parts: string[] = [];
  if (tags.surface) parts.push(`superficie ${tags.surface.replace(/;/g, ' y ')}`);
  if (tags.nudism === 'yes' || tags.nudism === 'designated') parts.push('zona nudista');
  if (tags.nudism === 'permissive') parts.push('nudismo permitido');
  if (tags.supervised === 'yes' || tags.lifeguard === 'yes') parts.push('con vigilancia');
  return parts.join('; ') || 'Playa muestreada desde OpenStreetMap';
}

// ---------- Main ----------

function readRaw(): OsmElement[] {
  const data = JSON.parse(readFileSync(RAW_FILE, 'utf8')) as { elements?: OsmElement[] };
  const elements = data.elements ?? [];

  // Deduplica por (tipo, id) como salvaguarda (la consulta única ya no solapa).
  const seen = new Set<string>();
  const unique: OsmElement[] = [];
  for (const el of elements) {
    const key = `${el.type}/${el.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(el);
  }
  return unique;
}

function main(): void {
  const elements = readRaw();
  const named = elements.filter((el) => el.tags?.name);

  const seedByName = new Map(SEED_OSM_MAP.map((entry) => [entry.osmName, entry]));
  const usedSeedIds = new Set<string>();
  const usedIds = new Set<string>();

  const beaches: unknown[] = [];

  for (const el of named) {
    const tags = el.tags!;
    const name = tags.name;
    const center = centerOf(el);
    const island = islandOf(center.lon, center.lat);

    const seedMatch = seedByName.get(name);
    let id: string;
    let municipality: string;

    if (seedMatch && !usedSeedIds.has(seedMatch.id)) {
      id = seedMatch.id;
      municipality = seedMatch.municipality;
      usedSeedIds.add(seedMatch.id);
    } else {
      id = `${slugify(name)}-${el.type}-${el.id}`;
      municipality = 'Baleares';
    }

    if (usedIds.has(id)) {
      id = `${slugify(name)}-${el.type}-${el.id}`;
    }
    usedIds.add(id);

    beaches.push({
      id,
      name,
      municipality,
      island,
      lon: Number(center.lon.toFixed(5)),
      lat: Number(center.lat.toFixed(5)),
      quality: 'sin-datos',
      blueFlag: false,
      services: mapServices(tags),
      description: descriptionOf(tags),
      lastSample: '',
      samples: [],
      source: SOURCE,
      updatedAt: UPDATED_AT,
      dataStatus: 'sampled',
    });
  }

  const content =
    '// Generado por scripts/build-osm-dataset.ts. No editar a mano.\n' +
    "import { Beach } from '../models/beach';\n\n" +
    `// ${beaches.length} playas OSM (natural=beach con nombre), muestra sin calidad oficial.\n` +
    `export const OSM_BEACHES: Beach[] = ${JSON.stringify(beaches, null, 2)};\n`;

  writeFileSync(OUT_FILE, content, 'utf8');

  const byIsland: Record<string, number> = {};
  for (const b of beaches as Array<{ island: string }>) {
    byIsland[b.island] = (byIsland[b.island] ?? 0) + 1;
  }

  console.log(`✓ ${beaches.length} playas OSM (con nombre) -> ${OUT_FILE}`);
  console.log(`  Por isla: ${JSON.stringify(byIsland)}`);
  console.log(`  Con id del seed: ${usedSeedIds.size}`);
}

void main();
