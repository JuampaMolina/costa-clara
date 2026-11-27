import { beforeEach, describe, expect, it } from 'vitest';
import { UiScaleService } from './ui-scale';

function factor(): string {
  return document.documentElement.style.getPropertyValue('--ui-factor');
}

describe('UiScaleService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--ui-factor');
  });

  it('arranca al nivel por defecto (100 %)', () => {
    const service = new UiScaleService();

    expect(service.index()).toBe(1);
    expect(factor()).toBe('1');
    expect(service.canDecrease()).toBe(true);
    expect(service.canIncrease()).toBe(true);
  });

  it('aumenta y reduce la escala', () => {
    const service = new UiScaleService();

    service.increase();
    expect(service.index()).toBe(2);
    expect(factor()).toBe('1.1');

    service.decrease();
    service.decrease();
    expect(service.index()).toBe(0);
    expect(factor()).toBe('0.9');
  });

  it('no se sale de los límites', () => {
    const service = new UiScaleService();

    for (let i = 0; i < 10; i++) service.increase();
    expect(service.index()).toBe(4);
    expect(service.canIncrease()).toBe(false);

    for (let i = 0; i < 10; i++) service.decrease();
    expect(service.index()).toBe(0);
    expect(service.canDecrease()).toBe(false);
  });

  it('vuelve al 100 % al restablecer', () => {
    const service = new UiScaleService();

    service.increase();
    service.reset();

    expect(service.index()).toBe(1);
    expect(factor()).toBe('1');
  });

  it('recuerda el nivel entre instancias', () => {
    const first = new UiScaleService();
    first.increase();

    const second = new UiScaleService();

    expect(second.index()).toBe(2);
    expect(factor()).toBe('1.1');
  });
});
