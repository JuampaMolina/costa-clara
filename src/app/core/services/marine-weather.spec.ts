import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FORECAST_API_URL,
  MARINE_API_URL,
  MARINE_SOURCE,
  MarineWeatherService,
} from './marine-weather';

const okResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const errorResponse = (status: number): Response =>
  ({ ok: false, status, json: async () => ({}) }) as unknown as Response;

const marineCurrent = {
  time: '2026-11-26T22:00',
  wave_height: 0.98,
  wave_period: 5.3,
  sea_surface_temperature: 19,
};

const forecastCurrent = {
  time: '2026-11-26T22:00',
  wind_speed_10m: 12.4,
  wind_direction_10m: 315,
};

/** Simula `fetch` enrutando por URL: marine → forecast → resto. */
function stubFetch(
  respond: (url: string) => Response | Promise<Response>,
): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    return Promise.resolve(respond(url));
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('MarineWeatherService', () => {
  const service = new MarineWeatherService();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve ok con oleaje y viento, la hora y la fuente', async () => {
    const fetchMock = stubFetch((url) =>
      url.startsWith(MARINE_API_URL)
        ? okResponse({ current: marineCurrent })
        : okResponse({ current: forecastCurrent }),
    );

    const result = await service.get(39.28, 2.99);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      status: 'ok',
      data: {
        waveHeight: 0.98,
        wavePeriod: 5.3,
        seaTemperature: 19,
        windSpeed: 12.4,
        windDirection: 315,
        observedAt: '2026-11-26T22:00',
        source: MARINE_SOURCE.name,
      },
    });
  });

  it('solicita las coordenadas, variables y zona horaria correctas en ambos endpoints', async () => {
    const fetchMock = stubFetch(() => okResponse({ current: {} }));

    await service.get(39.28, 2.99);

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    const marine = new URL(urls.find((url) => url.startsWith(MARINE_API_URL))!);
    const forecast = new URL(urls.find((url) => url.startsWith(FORECAST_API_URL))!);

    expect(marine.origin + marine.pathname).toBe(MARINE_API_URL);
    expect(marine.searchParams.get('latitude')).toBe('39.28');
    expect(marine.searchParams.get('longitude')).toBe('2.99');
    expect(marine.searchParams.get('current')).toBe(
      'wave_height,wave_period,sea_surface_temperature',
    );
    expect(marine.searchParams.get('timezone')).toBe('Europe/Madrid');

    expect(forecast.origin + forecast.pathname).toBe(FORECAST_API_URL);
    expect(forecast.searchParams.get('latitude')).toBe('39.28');
    expect(forecast.searchParams.get('longitude')).toBe('2.99');
    expect(forecast.searchParams.get('current')).toBe('wind_speed_10m,wind_direction_10m');
    expect(forecast.searchParams.get('timezone')).toBe('Europe/Madrid');
  });

  it('devuelve error http cuando ambos endpoints fallan', async () => {
    stubFetch(() => errorResponse(500));

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({ status: 'error', reason: 'http' });
  });

  it('devuelve ok con viento a null si el forecast falla', async () => {
    stubFetch((url) =>
      url.startsWith(MARINE_API_URL) ? okResponse({ current: marineCurrent }) : errorResponse(500),
    );

    const result = await service.get(39.28, 2.99);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data.waveHeight).toBe(0.98);
      expect(result.data.windSpeed).toBeNull();
      expect(result.data.windDirection).toBeNull();
      expect(result.data.observedAt).toBe('2026-11-26T22:00');
    }
  });

  it('devuelve ok con oleaje a null si marine falla', async () => {
    stubFetch((url) =>
      url.startsWith(MARINE_API_URL)
        ? errorResponse(500)
        : okResponse({ current: forecastCurrent }),
    );

    const result = await service.get(39.28, 2.99);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data.waveHeight).toBeNull();
      expect(result.data.wavePeriod).toBeNull();
      expect(result.data.seaTemperature).toBeNull();
      expect(result.data.windSpeed).toBe(12.4);
      expect(result.data.windDirection).toBe(315);
      expect(result.data.observedAt).toBe('2026-11-26T22:00');
    }
  });

  it('devuelve error ante JSON inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('JSON inválido');
        },
      } as unknown as Response),
    );

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({ status: 'error', reason: 'respuesta-invalida' });
  });

  it('devuelve error ante una respuesta sin el bloque "current"', async () => {
    stubFetch(() => okResponse({ latitude: 39.28 }));

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({ status: 'error', reason: 'respuesta-invalida' });
  });

  it('devuelve null para las variables ausentes en cada bloque', async () => {
    stubFetch((url) =>
      url.startsWith(MARINE_API_URL)
        ? okResponse({ current: { time: '2026-11-26T22:00', wave_height: 1.2 } })
        : okResponse({ current: { time: '2026-11-26T22:00', wind_speed_10m: 8.1 } }),
    );

    const result = await service.get(39.28, 2.99);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data.waveHeight).toBe(1.2);
      expect(result.data.wavePeriod).toBeNull();
      expect(result.data.seaTemperature).toBeNull();
      expect(result.data.windSpeed).toBe(8.1);
      expect(result.data.windDirection).toBeNull();
    }
  });

  it('devuelve error de red ante un rechazo de fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')));

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({ status: 'error', reason: 'red' });
  });
});
