import { Injectable } from '@angular/core';

/**
 * Estado del mar y viento en superficie (CC-27).
 *
 * Fuente: Open-Meteo, API abierta y sin clave de API
 * (https://open-meteo.com/). Licencia: CC BY 4.0.
 *
 * Se consultan dos endpoints en paralelo:
 * - `https://marine-api.open-meteo.com/v1/marine` → oleaje, periodo y temperatura del agua.
 * - `https://api.open-meteo.com/v1/forecast` → velocidad y dirección del viento a 10 m.
 *
 * Si uno de los dos falla, se devuelve `ok` con los campos que sí llegaron y `null`
 * en el resto. Solo si ambos fallan se devuelve un error tipado. No se envían
 * datos del usuario ni se guarda ninguna clave en el cliente.
 */

export const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';
export const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';

export const MARINE_SOURCE = {
  name: 'Open-Meteo Marine',
  url: 'https://open-meteo.com/',
  license: 'CC BY 4.0',
} as const;

/** Variables consultadas en la respuesta `current` de Open-Meteo Marine. */
const MARINE_CURRENT_VARIABLES = 'wave_height,wave_period,sea_surface_temperature';
/** Variables consultadas en la respuesta `current` de Open-Meteo Forecast. */
const FORECAST_CURRENT_VARIABLES = 'wind_speed_10m,wind_direction_10m';

export interface MarineWeather {
  /** Altura de ola en metros, o `null` si no está disponible. */
  waveHeight: number | null;
  /** Periodo de ola en segundos, o `null` si no está disponible. */
  wavePeriod: number | null;
  /** Temperatura del agua en superficie en °C, o `null` si no está disponible. */
  seaTemperature: number | null;
  /** Velocidad del viento en km/h, o `null` si no está disponible. */
  windSpeed: number | null;
  /** Dirección del viento en grados (0–360), o `null` si no está disponible. */
  windDirection: number | null;
  /** Instante de observación en ISO 8601 (hora local de Madrid), o `null`. */
  observedAt: string | null;
  /** Nombre de la fuente de los datos. */
  source: string;
}

export type MarineWeatherError = 'timeout' | 'http' | 'respuesta-invalida' | 'red';

export type MarineWeatherResult =
  { status: 'ok'; data: MarineWeather } | { status: 'error'; reason: MarineWeatherError };

type MarinePartial = Pick<
  MarineWeather,
  'waveHeight' | 'wavePeriod' | 'seaTemperature' | 'observedAt'
>;
type ForecastPartial = Pick<MarineWeather, 'windSpeed' | 'windDirection' | 'observedAt'>;

type PartialResult<T> = { ok: true; data: T } | { ok: false; reason: MarineWeatherError };

@Injectable({ providedIn: 'root' })
export class MarineWeatherService {
  private readonly timeoutMs = 8000;

  async get(lat: number, lon: number): Promise<MarineWeatherResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const [marine, forecast] = await Promise.all([
        this.getMarine(lat, lon, controller.signal),
        this.getForecast(lat, lon, controller.signal),
      ]);

      if (!marine.ok && !forecast.ok) {
        return { status: 'error', reason: marine.reason };
      }

      const marineData = marine.ok ? marine.data : null;
      const forecastData = forecast.ok ? forecast.data : null;

      return {
        status: 'ok',
        data: {
          waveHeight: marineData?.waveHeight ?? null,
          wavePeriod: marineData?.wavePeriod ?? null,
          seaTemperature: marineData?.seaTemperature ?? null,
          windSpeed: forecastData?.windSpeed ?? null,
          windDirection: forecastData?.windDirection ?? null,
          observedAt: marineData?.observedAt ?? forecastData?.observedAt ?? null,
          source: MARINE_SOURCE.name,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getMarine(
    lat: number,
    lon: number,
    signal: AbortSignal,
  ): Promise<PartialResult<MarinePartial>> {
    try {
      const response = await fetch(this.buildMarineUrl(lat, lon), { signal });

      if (!response.ok) {
        return { ok: false, reason: 'http' };
      }

      const current = this.readCurrent(await this.readJson(response));
      if (!current) {
        return { ok: false, reason: 'respuesta-invalida' };
      }

      return {
        ok: true,
        data: {
          waveHeight: readNumber(current['wave_height']),
          wavePeriod: readNumber(current['wave_period']),
          seaTemperature: readNumber(current['sea_surface_temperature']),
          observedAt: readString(current['time']),
        },
      };
    } catch (error) {
      return { ok: false, reason: isAbortError(error) ? 'timeout' : 'red' };
    }
  }

  private async getForecast(
    lat: number,
    lon: number,
    signal: AbortSignal,
  ): Promise<PartialResult<ForecastPartial>> {
    try {
      const response = await fetch(this.buildForecastUrl(lat, lon), { signal });

      if (!response.ok) {
        return { ok: false, reason: 'http' };
      }

      const current = this.readCurrent(await this.readJson(response));
      if (!current) {
        return { ok: false, reason: 'respuesta-invalida' };
      }

      return {
        ok: true,
        data: {
          windSpeed: readNumber(current['wind_speed_10m']),
          windDirection: readNumber(current['wind_direction_10m']),
          observedAt: readString(current['time']),
        },
      };
    } catch (error) {
      return { ok: false, reason: isAbortError(error) ? 'timeout' : 'red' };
    }
  }

  private buildMarineUrl(lat: number, lon: number): string {
    return buildUrl(MARINE_API_URL, lat, lon, MARINE_CURRENT_VARIABLES);
  }

  private buildForecastUrl(lat: number, lon: number): string {
    return buildUrl(FORECAST_API_URL, lat, lon, FORECAST_CURRENT_VARIABLES);
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private readCurrent(payload: unknown): Record<string, unknown> | null {
    if (!isRecord(payload)) return null;

    const current = payload['current'];
    return isRecord(current) ? current : null;
  }
}

function buildUrl(baseUrl: string, lat: number, lon: number, currentVariables: string): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: currentVariables,
    timezone: 'Europe/Madrid',
  });

  return `${baseUrl}?${params.toString()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}
