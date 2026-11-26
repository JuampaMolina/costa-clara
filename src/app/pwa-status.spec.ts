import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { PwaStatus } from './pwa-status';

class FakeSwUpdate {
  private readonly updates = new Subject<VersionEvent>();
  readonly versionUpdates = this.updates.asObservable();
  readonly activateUpdate = vi.fn().mockResolvedValue(true);
  enabled = false;

  get isEnabled(): boolean {
    return this.enabled;
  }

  emit(type: VersionEvent['type']): void {
    this.updates.next({ type } as VersionEvent);
  }
}

function setOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
}

describe('PwaStatus', () => {
  let fakeSwUpdate: FakeSwUpdate;

  beforeEach(() => {
    fakeSwUpdate = new FakeSwUpdate();
    TestBed.configureTestingModule({
      providers: [{ provide: SwUpdate, useValue: fakeSwUpdate }],
    });
    setOnline(true);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    setOnline(true);
    vi.unstubAllGlobals();
  });

  it('oculta el banner offline cuando hay conexión', () => {
    const fixture = TestBed.createComponent(PwaStatus);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="pwa-offline-banner"]')).toBeNull();
  });

  it('muestra el banner offline al arrancar sin conexión, accesible', () => {
    setOnline(false);
    const fixture = TestBed.createComponent(PwaStatus);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector(
      '[data-testid="pwa-offline-banner"]',
    ) as HTMLElement | null;
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute('role')).toBe('status');
    expect(banner!.getAttribute('aria-live')).toBe('polite');
    expect(banner!.textContent).toContain('Sin conexión');
  });

  it('reacciona a los eventos offline/online', () => {
    const fixture = TestBed.createComponent(PwaStatus);
    fixture.detectChanges();

    window.dispatchEvent(new Event('offline'));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="pwa-offline-banner"]'),
    ).not.toBeNull();

    window.dispatchEvent(new Event('online'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="pwa-offline-banner"]')).toBeNull();
  });

  it('muestra el aviso de actualización al recibir VERSION_READY', () => {
    fakeSwUpdate.enabled = true;
    const fixture = TestBed.createComponent(PwaStatus);
    fixture.detectChanges();

    fakeSwUpdate.emit('VERSION_READY');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector(
      '[data-testid="pwa-update-banner"]',
    ) as HTMLElement | null;
    expect(banner).not.toBeNull();
    expect(banner!.textContent).toContain('Actualizar');
  });

  it('ignora VERSION_READY cuando el service worker está deshabilitado', () => {
    fakeSwUpdate.enabled = false;
    const fixture = TestBed.createComponent(PwaStatus);
    fixture.detectChanges();

    fakeSwUpdate.emit('VERSION_READY');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="pwa-update-banner"]')).toBeNull();
  });

  it('llama a activateUpdate y recarga al pulsar Actualizar', async () => {
    fakeSwUpdate.enabled = true;
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });

    const fixture = TestBed.createComponent(PwaStatus);
    fixture.detectChanges();

    fakeSwUpdate.emit('VERSION_READY');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="pwa-update-banner"] button',
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();

    button!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fakeSwUpdate.activateUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
