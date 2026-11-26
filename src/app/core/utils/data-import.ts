import {
  Accessibility,
  Beach,
  BeachSample,
  ISLANDS,
  QUALITY_LABELS,
  SERVICES,
  ServiceId,
  WaterQuality,
} from '../models/beach';

export interface RawRow {
  [key: string]: string | undefined;
}

const ISLAND_IDS = ISLANDS.map((island) => island.id);
const QUALITY_IDS = Object.keys(QUALITY_LABELS) as WaterQuality[];
const SERVICE_IDS = SERVICES.map((service) => service.id);
const ACCESSIBILITY_IDS: Accessibility[] = ['adaptada', 'parcial', 'sin-datos'];

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class DataImportError extends Error {
  constructor(readonly issues: string[]) {
    super(`El dataset tiene ${issues.length} error(es):\n- ${issues.join('\n- ')}`);
    this.name = 'DataImportError';
  }
}

export function buildDataset(beachRows: RawRow[], sampleRows: RawRow[] = []): Beach[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const samplesByBeach = new Map<string, BeachSample[]>();
  const samplesSeen = new Map<string, Set<string>>();
  const beaches: Beach[] = [];

  for (const [index, sampleRow] of sampleRows.entries()) {
    const line = `muestra #${index + 2}`;
    const beachId = text(sampleRow, 'beach_id');
    const date = requireText(sampleRow, 'date', line, issues);
    const quality = parseEnum<WaterQuality>(
      text(sampleRow, 'quality'),
      QUALITY_IDS,
      'quality',
      line,
      issues
    );

    if (!beachId) {
      issues.push(`${line}: falta beach_id`);
      continue;
    }

    if (date && !DATE_PATTERN.test(date)) {
      issues.push(`${line}: date debe tener formato YYYY-MM-DD (recibido "${date}")`);
      continue;
    }

    if (!quality) continue;

    const seen = samplesSeen.get(beachId) ?? new Set<string>();
    if (seen.has(date)) {
      issues.push(`${line}: muestra duplicada para "${beachId}" en ${date}`);
      continue;
    }

    seen.add(date);
    samplesSeen.set(beachId, seen);
    samplesByBeach.set(beachId, [
      ...(samplesByBeach.get(beachId) ?? []),
      { date, quality },
    ]);
  }

  for (const [index, row] of beachRows.entries()) {
    const line = `playa #${index + 2}`;
    const id = requireText(row, 'id', line, issues);
    const name = requireText(row, 'name', line, issues);
    const municipality = requireText(row, 'municipality', line, issues);
    const description = requireText(row, 'description', line, issues);
    const sourceName = requireText(row, 'source_name', line, issues);
    const sourceUrl = requireText(row, 'source_url', line, issues);
    const sourceLicense = requireText(row, 'source_license', line, issues);
    const updatedAt = requireText(row, 'updated_at', line, issues);

    if (id && !ID_PATTERN.test(id)) {
      issues.push(`${line}: id "${id}" debe ser un slug en minúsculas (ej. cala-macarella)`);
    }

    if (id && ids.has(id)) {
      issues.push(`${line}: id duplicado "${id}"`);
    }

    if (sourceUrl) {
      try {
        new URL(sourceUrl);
      } catch {
        issues.push(`${line}: source_url no es una URL válida`);
      }
    }

    if (updatedAt && !DATE_PATTERN.test(updatedAt)) {
      issues.push(`${line}: updated_at debe tener formato YYYY-MM-DD`);
    }

    const island = parseEnum(
      requireText(row, 'island', line, issues),
      ISLAND_IDS,
      'island',
      line,
      issues
    );
    const lon = parseCoordinate(text(row, 'lon'), 'lon', 1, 4.5, line, issues);
    const lat = parseCoordinate(text(row, 'lat'), 'lat', 38.5, 40.2, line, issues);
    const blueFlag = parseBoolean(text(row, 'blue_flag'), 'blue_flag', line, issues);
    const services = parseServices(text(row, 'services'), line, issues);
    const sourceAccessibility = text(row, 'accessibility');

    let accessibility: Accessibility = services.includes('Acceso adaptado')
      ? 'adaptada'
      : 'sin-datos';

    if (sourceAccessibility) {
      const parsed = parseEnum(
        sourceAccessibility,
        ACCESSIBILITY_IDS,
        'accessibility',
        line,
        issues
      );
      if (parsed) accessibility = parsed;
    }

    const blueFlagYear = parseOptionalYear(text(row, 'blue_flag_year'), line, issues);
    const samples = (samplesByBeach.get(id) ?? []).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const latest = samples.at(-1);

    if (id && !samples.length) {
      issues.push(`${line}: la playa "${id}" no tiene muestras en samples.csv`);
    }

    if (!id || !island || lon === null || lat === null || blueFlag === null) {
      continue;
    }

    ids.add(id);
    beaches.push({
      id,
      name,
      municipality,
      island,
      lon,
      lat,
      quality: latest?.quality ?? 'sin-datos',
      blueFlag,
      blueFlagYear,
      services,
      accessibility,
      description,
      lastSample: latest?.date ?? '',
      samples,
      source: {
        name: sourceName,
        url: sourceUrl,
        license: sourceLicense,
      },
      updatedAt,
      dataStatus: 'real',
    });
  }

  for (const beachId of samplesByBeach.keys()) {
    if (!ids.has(beachId)) {
      issues.push(`samples.csv: la muestra referencia una playa inexistente "${beachId}"`);
    }
  }

  if (issues.length) {
    throw new DataImportError(issues);
  }

  return beaches.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function text(row: RawRow, key: string): string {
  return (row[key] ?? '').trim();
}

function requireText(row: RawRow, key: string, line: string, issues: string[]): string {
  const value = text(row, key);

  if (!value) {
    issues.push(`${line}: falta el campo obligatorio "${key}"`);
  }

  return value;
}

function parseEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  field: string,
  line: string,
  issues: string[]
): T | null {
  if (!value) return null;

  if (!allowed.includes(value as T)) {
    issues.push(`${line}: ${field} "${value}" no es válido. Valores: ${allowed.join(', ')}`);
    return null;
  }

  return value as T;
}

function parseCoordinate(
  value: string,
  field: string,
  min: number,
  max: number,
  line: string,
  issues: string[]
): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    issues.push(`${line}: ${field} no es un número válido`);
    return null;
  }

  if (parsed < min || parsed > max) {
    issues.push(`${line}: ${field} ${parsed} está fuera del rango de Baleares (${min}–${max})`);
    return null;
  }

  return parsed;
}

function parseBoolean(
  value: string,
  field: string,
  line: string,
  issues: string[]
): boolean | null {
  const normalized = value.toLowerCase();

  if (['1', 'true', 'si', 'sí', 'yes'].includes(normalized)) return true;
  if (['0', 'false', 'no'].includes(normalized)) return false;

  issues.push(`${line}: ${field} debe ser 0/1 o true/false (recibido "${value}")`);
  return null;
}

function parseServices(value: string, line: string, issues: string[]): ServiceId[] {
  if (!value) return [];

  const services = [
    ...new Set(
      value
        .split(/[;|,]/)
        .map((service) => service.trim())
        .filter(Boolean)
    ),
  ];

  for (const service of services) {
    if (!SERVICE_IDS.includes(service as ServiceId)) {
      issues.push(
        `${line}: servicio "${service}" no válido. Valores: ${SERVICE_IDS.join(', ')}`
      );
    }
  }

  return services.filter((service): service is ServiceId =>
    SERVICE_IDS.includes(service as ServiceId)
  );
}

function parseOptionalYear(value: string, line: string, issues: string[]): number | undefined {
  if (!value) return undefined;

  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    issues.push(`${line}: blue_flag_year debe ser un año entre 2000 y 2100`);
    return undefined;
  }

  return year;
}
