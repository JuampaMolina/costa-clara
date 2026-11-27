import { beforeEach, describe, expect, it } from 'vitest';
import { UiScaleService } from './ui-scale';

function baseSize(): string {
  return document.documentElement.style.getPropertyValue('--ui-base');
}

describe('UiScaleService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--ui-base');
  });

  it('arranca en Auto sin fijar la base', () => {
    const service = new UiScaleService();

    expect(service.value()).toBe('auto');
    expect(baseSize()).toBe('');
  });

  it('fija el tamaño en porcentaje de 16 px', () => {
    const service = new UiScaleService();

    service.set('125');
    expect(service.value()).toBe('125');
    expect(baseSize()).toBe('20px');

    service.set('150');
    expect(baseSize()).toBe('24px');
  });

  it('vuelve a Auto y quita la base fija', () => {
    const service = new UiScaleService();

    service.set('150');
    service.set('auto');

    expect(service.value()).toBe('auto');
    expect(baseSize()).toBe('');
  });

  it('ignora valores no admitidos', () => {
    const service = new UiScaleService();

    service.set('999');
    service.set('grande');

    expect(service.value()).toBe('auto');
    expect(baseSize()).toBe('');
  });

  it('recuerda el nivel entre instancias', () => {
    const first = new UiScaleService();
    first.set('110');

    const second = new UiScaleService();

    expect(second.value()).toBe('110');
    expect(baseSize()).toBe('17.6px');
  });
});
