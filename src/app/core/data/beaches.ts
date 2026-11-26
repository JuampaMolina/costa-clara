import { Beach } from '../models/beach';
import { GENERATED_BEACHES } from './beaches.generated';
import { BEACHES as SEED_BEACHES } from './beaches.seed';

export type DataStatus = 'demo' | 'real';

export const DATA_STATUS: DataStatus = GENERATED_BEACHES ? 'real' : 'demo';

export const BEACHES: Beach[] = GENERATED_BEACHES ?? SEED_BEACHES;
