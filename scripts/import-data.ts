import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { DataImportError, RawRow, buildDataset } from '../src/app/core/utils/data-import';
import { writeSitemap } from './generate-sitemap';

const root = resolve(import.meta.dirname, '..');

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function readRows(path: string): RawRow[] {
  if (!existsSync(path)) return [];

  return parse(readFileSync(path, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as RawRow[];
}

const inputDir = resolve(root, argument('input', 'data/raw'));
const outputPath = resolve(root, argument('output', 'src/app/core/data/beaches.generated.ts'));
const beachesPath = resolve(inputDir, 'beaches.csv');
const samplesPath = resolve(inputDir, 'samples.csv');

if (!existsSync(beachesPath)) {
  console.error(`No existe ${beachesPath}`);
  console.error('Descarga la fuente oficial en data/raw o prueba con: npm run data:example');
  process.exit(1);
}

try {
  const beaches = buildDataset(readRows(beachesPath), readRows(samplesPath));
  const content = `// Generado por scripts/import-data.ts. No editar a mano.\nimport { Beach } from '../models/beach';\n\nexport const GENERATED_BEACHES: Beach[] | null = ${JSON.stringify(
    beaches,
    null,
    2,
  )};\n`;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, 'utf8');

  writeSitemap(beaches);

  console.log(`✓ ${beaches.length} playas importadas desde ${inputDir}`);
  console.log(`  Salida: ${outputPath}`);
  console.log(`  Sitemap: public/sitemap.xml`);
} catch (error) {
  if (error instanceof DataImportError) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}
