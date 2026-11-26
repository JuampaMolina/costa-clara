import { Injectable } from '@angular/core';

/**
 * Estado del mar y temperatura del agua en superficie (CC-27).
 *
 * Fuente: Open-Meteo Marine, API abierta y sin clave de API
 * (https://marine-api.open-meteo.com/). Licencia: CC BY 4.0.
 *
 * Solo se envían las coordenadas de la playa; no se envía ningún dato del
 * usuario ni se guarda ninguna clave en el cliente. Si la API falla, se
 * devuelve un resultado de error tipado en lugar de lanzar una excepción.
 */

export const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';

export const MARINE_SOURCE = {
  name: 'Open-Meteo Marine',
  url: 'https://open-meteo.com/',
  license: 'CC BY 4.0',
} as const;

/** Variables consultadas en la respuesta `current` de Open-Meteo Marine. */
const CURRENT_VARIABLES = 'wave_height,wave_period,sea_surface_temperature';

export interface MarineWeather {
  /** Altura de ola en metros, o `null` si no está disponible. */
  waveHeight: number | null;
  /** Periodo de ola en segundos, o `null` si no está disponible. */
  wavePeriod: number | null;
  /** Temperatura del agua en superficie en °C, o `null` si no está disponible. */
  seaTemperature: number | null;
  /** Instante de observación en ISO 8601 (hora local de Madrid), o `null`. */
  observedAt: string | null;
  /** Nombre de la fuente de los datos. */
  source: string;
}

export type MarineWeatherError = 'timeout' | 'http' | 'respuesta-invalida' | 'red';

export type MarineWeatherResult =
  { status: 'ok'; data: MarineWeather } | { status: 'error'; reason: MarineWeatherError };

interface MarineCurrentPayload {
  time?: unknown;
  wave_height?: unknown;
  wave_period?: unknown;
  sea_surface_temperature?: unknown;
}

@Injectable({ providedIn: 'root' })
export class MarineWeatherService {
  private readonly timeoutMs = 8000;

  async get(lat: number, lon: number): Promise<MarineWeatherResult> {
    const url = this.buildUrl(lat, lon);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        return { status: 'error', reason: 'http' };
      }

      const payload = await this.readJson(response);
      const current = this.readCurrent(payload);
      if (!current) {
        return { status: 'error', reason: 'respuesta-invalida' };
      }

      return {
        status: 'ok',
        data: {
          waveHeight: readNumber(current.wave_height),
          wavePeriod: readNumber(current.wave_period),
          seaTemperature: readNumber(current.sea_surface_temperature),
          observedAt: readString(current.time),
          source: MARINE_SOURCE.name,
        },
      };
    } catch (error) {
      return { status: 'error', reason: isAbortError(error) ? 'timeout' : 'red' };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(lat: number, lon: number): string {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: CURRENT_VARIABLES,
      timezone: 'Europe/Madrid',
    });

    return `${MARINE_API_URL}?${params.toString()}`;
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private readCurrent(payload: unknown): MarineCurrentPayload | null {
    if (!isRecord(payload)) return null;

    const current = payload['current'];
    return isRecord(current) ? (current as MarineCurrentPayload) : null;
  }
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
