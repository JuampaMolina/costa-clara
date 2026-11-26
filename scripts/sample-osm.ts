/**
 * scripts/sample-osm.ts — Agregación del muestreo OSM de playas de Baleares.
 *
 * PoC de viabilidad de datos reales (rama feat/real-data). NO alimenta la app:
 * produce un dataset de demostración en data/generated/ con su procedencia, para
 * validar "fuente pública -> normalización -> ServiceId" antes de sustituir el seed.
 *
 * Lee el muestreo crudo de `data/raw/overpass/` (capturado desde la Overpass API,
 * ver data/raw/overpass/README.md) y lo agrega a un dataset pequeño de 10 playas
 * reales del seed con mapeo de etiquetas OSM a `ServiceId`.
 *
 * La calidad del agua queda en "sin-datos": la fuente de calidad (EEA/NÁYADE) se
 * valida por separado (CC-13) y aquí no se inventa ni se fuerza `dataStatus: real`.
 *
 * Uso: npx tsx scripts/sample-osm.ts
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ---------- Configuración ----------

const ROOT = resolve(import.meta.dirname, '..');
const RAW_DIR = resolve(ROOT, 'data/raw/overpass');
const OUT_DIR = resolve(ROOT, 'data/generated');
const OUT_FILE = resolve(OUT_DIR, 'beaches-osm.json');

const SOURCE = {
  name: 'OpenStreetMap',
  url: 'https://www.openstreetmap.org/copyright',
  license: 'ODbL 1.0',
  attribution: '© OpenStreetMap contributors',
};

// Isla por coordenadas (solo para el recuento informativo de `meta.per_island`);
// el dataset final usa la isla curada de `SAMPLE`.
function islandOf(lon: number, lat: number): string {
  if (lon >= 3.55) return 'menorca';
  if (lon < 1.75 && lat < 38.78) return 'formentera';
  if (lon < 1.75) return 'ibiza';
  return 'mallorca';
}

// Playas del seed que se muestrean en el PoC, con su variante de nombre en OSM.
const SAMPLE: ReadonlyArray<{
  id: string;
  osmName: string;
  island: string;
  municipality: string;
}> = [
  { id: 'es-trenc', osmName: "Platja d'es Trenc", island: 'mallorca', municipality: 'Campos' },
  { id: 'cala-varques', osmName: 'Cala Varques', island: 'mallorca', municipality: 'Manacor' },
  { id: 'cala-macarella', osmName: 'Cala Macarella', island: 'menorca', municipality: 'Ciutadella de Menorca' },
  { id: 'son-bou', osmName: 'Son Bou', island: 'menorca', municipality: 'Alaior' },
  { id: 'cala-en-turqueta', osmName: 'Cala en Turqueta', island: 'menorca', municipality: 'Ciutadella de Menorca' },
  { id: 'punta-prima', osmName: 'Platja de Punta Prima', island: 'menorca', municipality: 'Sant Lluís' },
  { id: 'cala-comte', osmName: 'Platges de Comte', island: 'ibiza', municipality: 'Sant Josep de sa Talaia' },
  { id: 'cala-dhort', osmName: "Cala d'Hort", island: 'ibiza', municipality: 'Sant Josep de sa Talaia' },
  { id: 'platja-den-bossa', osmName: "Platja d'en Bossa", island: 'ibiza', municipality: 'Sant Josep de sa Talaia' },
  { id: 'cala-saona', osmName: 'Platja cala Saona', island: 'formentera', municipality: 'Formentera' },
  { id: 'platja-de-migjorn', osmName: 'Platja de Migjorn', island: 'formentera', municipality: 'Formentera' },
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

type PocBeach = {
  id: string;
  name: string;
  municipality: string;
  island: string;
  lon: number;
  lat: number;
  services: string[];
  description: string;
  osm: { type: string; id: number };
  quality: 'sin-datos';
  quality_note: string;
};

// ---------- Utilidades ----------

function centerOf(el: OsmElement): { lon: number; lat: number } {
  return el.type === 'node'
    ? { lon: el.lon!, lat: el.lat! }
    : { lon: el.center!.lon, lat: el.center!.lat };
}

function mapServices(tags: Record<string, string>): string[] {
  const services: string[] = [];
  if (tags.lifeguard === 'yes' || tags.supervised === 'yes') services.push('Socorrista');
  if (tags.wheelchair === 'yes' || tags.wheelchair === 'limited') services.push('Acceso adaptado');
  // Aseos, Duchas, Aparcamiento y Chiringuito requieren join espacial con features
  // `amenity` separadas (no se incluyen aquí; ver data/raw/overpass/README.md).
  return services;
}

function descriptionOf(tags: Record<string, string>): string {
  const parts: string[] = [];
  if (tags.surface) parts.push(`superficie ${tags.surface.replace(';', ' y ')}`);
  if (tags.nudism === 'yes') parts.push('zona nudista');
  if (tags.nudism === 'permissive') parts.push('nudismo permitido');
  return parts.join('; ') || 'Playa (sin descripción adicional en OSM)';
}

// ---------- Main ----------

function readRaw(): OsmElement[] {
  // El fichero `osm-beaches-all.json` es el muestreo completo de una sola consulta
  // (bbox de todo Baleares); los `osm-beaches-<isla>.json` son recortes con solape.
  const all = join(RAW_DIR, 'osm-beaches-all.json');
  const data = JSON.parse(readFileSync(all, 'utf8')) as { elements?: OsmElement[] };
  return data.elements ?? [];
}

function main(): void {
  const elements = readRaw();
  const named = elements.filter((e) => e.tags?.name);

  const counts: Record<string, number> = {};
  for (const el of elements) {
    const c = centerOf(el);
    const island = islandOf(c.lon, c.lat);
    counts[island] = (counts[island] ?? 0) + 1;
  }

  const byName = new Map<string, OsmElement>();
  for (const el of named) byName.set(el.tags!.name, el);

  const beaches: PocBeach[] = [];
  const missing: string[] = [];
  for (const s of SAMPLE) {
    const el = byName.get(s.osmName);
    if (!el) {
      missing.push(`${s.id} ("${s.osmName}")`);
      continue;
    }
    const c = centerOf(el);
    beaches.push({
      id: s.id,
      name: el.tags!.name,
      municipality: s.municipality,
      island: s.island,
      lon: Number(c.lon.toFixed(5)),
      lat: Number(c.lat.toFixed(5)),
      services: mapServices(el.tags!),
      description: descriptionOf(el.tags!),
      osm: { type: el.type, id: el.id },
      quality: 'sin-datos',
      quality_note: 'Pendiente de EEA/NÁYADE (CC-13); no se inventa calidad.',
    });
  }

  const payload = {
    meta: {
      title: 'Muestra de viabilidad de playas de Baleares (PoC OSM)',
      generated_by: 'scripts/sample-osm.ts',
      beaches_count: beaches.length,
      total_osm_beaches: elements.length,
      named_osm_beaches: named.length,
      per_island: counts,
      missing_from_seed: missing,
      note:
        'Datos reales de geometría/nombre/servicios (OSM, ODbL). Calidad del agua sin datos: ' +
        'se conecta EEA/NÁYADE por separado y no se fuerza dataStatus real.',
    },
    sources: [SOURCE],
    beaches,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`✓ ${beaches.length} playas muestreadas -> ${OUT_FILE}`);
  console.log(`  Total OSM en Baleares: ${elements.length} (${named.length} con nombre).`);
  console.log(`  Por isla: ${JSON.stringify(counts)}`);
  if (missing.length) {
    console.warn(`  Sin coincidencia OSM: ${missing.join(', ')}`);
  }
  console.log('  Servicios por playa:');
  for (const b of beaches) {
    console.log(`    ${b.name}: ${b.services.length ? b.services.join(', ') : '(sin etiquetas de servicio)'}`);
  }
}

void main();
