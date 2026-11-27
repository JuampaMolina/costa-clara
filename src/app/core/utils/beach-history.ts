import { Beach, BeachSample, QUALITY_RANK } from '../models/beach';

export type QualityTrend = 'mejora' | 'empeora' | 'estable' | 'sin-datos';

export function getBeachSamples(beach: Beach): BeachSample[] {
  if (beach.samples?.length) {
    return [...beach.samples].sort((a, b) => a.date.localeCompare(b.date));
  }

  if (!beach.lastSample) return [];

  return [{ date: beach.lastSample, quality: beach.quality }];
}

export function getSamplesTrend(samples: BeachSample[]): QualityTrend {
  const ordered = [...samples].sort((a, b) => a.date.localeCompare(b.date));
  if (ordered.length < 2) return 'sin-datos';

  const previous = ordered[ordered.length - 2];
  const latest = ordered[ordered.length - 1];

  if (previous.quality === 'sin-datos' || latest.quality === 'sin-datos') {
    return 'sin-datos';
  }

  const diff = QUALITY_RANK[latest.quality] - QUALITY_RANK[previous.quality];

  if (diff > 0) return 'mejora';
  if (diff < 0) return 'empeora';
  return 'estable';
}

export function getQualityTrend(beach: Beach): QualityTrend {
  return getSamplesTrend(getBeachSamples(beach));
}
