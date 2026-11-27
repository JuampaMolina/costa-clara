import { Beach } from '../models/beach';
import { GENERATED_BEACHES } from './beaches.generated';
import { BEACHES as SEED_BEACHES } from './beaches.seed';
import { OSM_BEACHES } from './beaches-osm.generated';

export type DataStatus = 'demo' | 'real' | 'sampled';

export const DATA_STATUS: DataStatus = GENERATED_BEACHES ? 'real' : 'demo';

export const BEACHES: Beach[] = GENERATED_BEACHES ?? SEED_BEACHES;

/**
 * Identifica el conjunto de datos activo. `seed` es el dataset curado (demo u
 * oficial) y `osm` es el muestreo grande de OpenStreetMap (calidad pendiente).
 */
export type DatasetId = 'seed' | 'osm';

/** Devuelve las playas del dataset indicado. */
export function beachesFor(dataset: DatasetId): Beach[] {
  return dataset === 'osm' ? OSM_BEACHES : BEACHES;
}

export { OSM_BEACHES };
