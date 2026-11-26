export interface Coordinates {
  lon: number;
  lat: number;
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;

  return `${km.toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`;
}
