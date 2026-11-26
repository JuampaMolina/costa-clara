import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENT_NAME, AnalyticsDetail, AnalyticsService } from './analytics';

describe('AnalyticsService', () => {
  const service = new AnalyticsService();

  const listen = (): ReturnType<typeof vi.fn> => {
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_EVENT_NAME, listener);
    return listener;
  };

  beforeEach(() => {
    delete (window as { plausible?: unknown }).plausible;
  });

  afterEach(() => {
    delete (window as { plausible?: unknown }).plausible;
    vi.restoreAllMocks();
  });

  it('emite un CustomEvent con el nombre y el detalle tipado', () => {
    const listener = listen();

    service.track('search', { query: 'cala', island: 'mallorca' });

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0][0] as CustomEvent<AnalyticsDetail>;
    expect(event.type).toBe(ANALYTICS_EVENT_NAME);
    expect(event.detail).toEqual({
      event: 'search',
      props: { query: 'cala', island: 'mallorca' },
    });
  });

  it('reenvía a Plausible cuando está disponible', () => {
    const plausible = vi.fn();
    (window as { plausible?: unknown }).plausible = plausible;

    service.track('favorite', { beach: 'es-trenc' });

    expect(plausible).toHaveBeenCalledWith('favorite', { props: { beach: 'es-trenc' } });
  });

  it('no envía nada por la red si Plausible no está disponible', () => {
    expect(() => service.track('filter', { service: 'Socorrista' })).not.toThrow();
  });

  it('descarta propiedades undefined y no primitivas', () => {
    const listener = listen();

    service.track('beach_open', {
      beach: 'es-trenc',
      omitido: undefined,
      anidado: { sub: 1 } as unknown as string,
    });

    const event = listener.mock.calls[0][0] as CustomEvent<AnalyticsDetail>;
    expect(event.detail.props).toEqual({ beach: 'es-trenc' });
  });

  it('no añade datos personales a los eventos', () => {
    const listener = listen();

    service.track('search', { query: 'cala', island: 'mallorca' });

    const event = listener.mock.calls[0][0] as CustomEvent<AnalyticsDetail>;
    expect(Object.keys(event.detail.props)).toEqual(['query', 'island']);
    expect(JSON.stringify(event.detail).toLowerCase()).not.toMatch(
      /ip|email|correo|cookie|localstorage|user.?agent/,
    );
  });
});
