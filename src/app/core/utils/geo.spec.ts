import { describe, expect, it } from 'vitest';
import { distanceKm, formatDistance } from './geo';

describe('geo', () => {
  it('returns zero for the same point', () => {
    expect(distanceKm({ lon: 2.65, lat: 39.57 }, { lon: 2.65, lat: 39.57 })).toBe(0);
  });

  it('calculates a known distance', () => {
    expect(distanceKm({ lon: 0, lat: 0 }, { lon: 0, lat: 1 })).toBeCloseTo(111.19, 1);
  });

  it('formats metres and kilometres', () => {
    expect(formatDistance(0.42)).toBe('420 m');
    expect(formatDistance(12.34)).toMatch(/^12,3 km$/);
  });
});
