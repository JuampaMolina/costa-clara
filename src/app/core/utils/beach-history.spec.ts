import { describe, expect, it } from 'vitest';
import { Beach } from '../models/beach';
import { getBeachSamples, getQualityTrend } from './beach-history';

const base: Beach = {
  id: 'test',
  name: 'Test',
  municipality: 'Test',
  island: 'mallorca',
  lon: 2.9,
  lat: 39.5,
  quality: 'buena',
  blueFlag: false,
  services: [],
  description: '',
  lastSample: '2026-09-01',
};

describe('beach history', () => {
  it('falls back to the last sample when there is no history', () => {
    expect(getBeachSamples(base)).toEqual([{ date: '2026-09-01', quality: 'buena' }]);
  });

  it('returns samples sorted by date', () => {
    const beach: Beach = {
      ...base,
      samples: [
        { date: '2026-09-01', quality: 'buena' },
        { date: '2026-06-01', quality: 'excelente' },
      ],
    };

    expect(getBeachSamples(beach).map((sample) => sample.date)).toEqual([
      '2026-06-01',
      '2026-09-01',
    ]);
  });

  it('detects improvement, worsening and stability', () => {
    const withHistory = (qualities: Beach['quality'][]): Beach => ({
      ...base,
      samples: qualities.map((quality, index) => ({
        date: `2026-0${index + 1}-01`,
        quality,
      })),
    });

    expect(getQualityTrend(withHistory(['buena', 'excelente']))).toBe('mejora');
    expect(getQualityTrend(withHistory(['excelente', 'buena']))).toBe('empeora');
    expect(getQualityTrend(withHistory(['buena', 'buena']))).toBe('estable');
    expect(getQualityTrend(withHistory(['buena']))).toBe('sin-datos');
  });

  it('ignores the trend when the latest sample has no data', () => {
    const beach: Beach = {
      ...base,
      samples: [
        { date: '2026-06-01', quality: 'excelente' },
        { date: '2026-09-01', quality: 'sin-datos' },
      ],
    };

    expect(getQualityTrend(beach)).toBe('sin-datos');
  });
});
