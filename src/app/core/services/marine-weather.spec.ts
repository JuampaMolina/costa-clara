import { afterEach, describe, expect, it, vi } from 'vitest';
import { MARINE_API_URL, MARINE_SOURCE, MarineWeatherService } from './marine-weather';

const okResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const errorResponse = (status: number): Response =>
  ({ ok: false, status, json: async () => ({}) }) as unknown as Response;

describe('MarineWeatherService', () => {
  const service = new MarineWeatherService();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve ok con las variables del mar, la hora y la fuente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        okResponse({
          current: {
            time: '2026-11-26T22:00',
            wave_height: 0.98,
            wave_period: 5.3,
            sea_surface_temperature: 19,
          },
        }),
      ),
    );

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({
      status: 'ok',
      data: {
        waveHeight: 0.98,
        wavePeriod: 5.3,
        seaTemperature: 19,
        observedAt: '2026-11-26T22:00',
        source: MARINE_SOURCE.name,
      },
    });
  });

  it('solicita las coordenadas, las variables y la zona horaria correctas', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ current: {} }));
    vi.stubGlobal('fetch', fetchMock);

    await service.get(39.28, 2.99);

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(MARINE_API_URL);
    expect(parsed.searchParams.get('latitude')).toBe('39.28');
    expect(parsed.searchParams.get('longitude')).toBe('2.99');
    expect(parsed.searchParams.get('current')).toBe(
      'wave_height,wave_period,sea_surface_temperature',
    );
    expect(parsed.searchParams.get('timezone')).toBe('Europe/Madrid');
  });

  it('devuelve error ante una respuesta HTTP no satisfactoria', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(500)));

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({ status: 'error', reason: 'http' });
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ latitude: 39.28 })));

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({ status: 'error', reason: 'respuesta-invalida' });
  });

  it('devuelve null para las variables ausentes, incluida la temperatura del agua', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(okResponse({ current: { time: '2026-11-26T22:00', wave_height: 1.2 } })),
    );

    const result = await service.get(39.28, 2.99);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data.waveHeight).toBe(1.2);
      expect(result.data.wavePeriod).toBeNull();
      expect(result.data.seaTemperature).toBeNull();
    }
  });

  it('devuelve error de red ante un rechazo de fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')));

    const result = await service.get(39.28, 2.99);

    expect(result).toEqual({ status: 'error', reason: 'red' });
  });
});
