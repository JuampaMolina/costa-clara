import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';
import { TranslationService } from './core/i18n/translation.service';

/**
 * Avisos de PWA (CC-40).
 *
 * - Sin conexión: muestra un banner cuando `navigator.onLine` es `false` y lo
 *   oculta al recuperar la red (eventos `offline`/`online`). En flujo normal,
 *   no tapa la cabecera ni los controles.
 * - Nueva versión: escucha `versionUpdates` de `SwUpdate` y, al recibir
 *   `VERSION_READY`, ofrece un botón para activar la actualización y recargar.
 *   Solo se suscribe si `SwUpdate.isEnabled`.
 */
@Component({
  selector: 'app-pwa-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (offline()) {
      <div
        role="status"
        aria-live="polite"
        data-testid="pwa-offline-banner"
        class="flex items-center justify-center gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M12 19h.01M8.2 15.8a5 5 0 0 1 7.6 0M5 12.5a9 9 0 0 1 14 0"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M3 3l18 18" stroke-linecap="round" />
        </svg>
        <span>{{ i18n.t('pwa.offline') }}</span>
      </div>
    }

    @if (updateReady()) {
      <div
        role="status"
        aria-live="polite"
        data-testid="pwa-update-banner"
        class="flex flex-wrap items-center justify-center gap-2 border-b border-sky-200 bg-sky-50 px-4 py-2 text-center text-xs font-medium text-sky-900"
      >
        <span>{{ i18n.t('pwa.updateReady') }}</span>
        <button
          type="button"
          class="rounded-full bg-sky-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-600"
          (click)="activateUpdate()"
        >
          {{ i18n.t('pwa.updateAction') }}
        </button>
      </div>
    }
  `,
})
export class PwaStatus {
  private readonly document = inject(DOCUMENT);
  readonly i18n = inject(TranslationService);
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  readonly offline = signal(false);
  readonly updateReady = signal(false);

  private updateSubscription?: Subscription;

  constructor() {
    const win = this.document.defaultView;

    this.offline.set(win ? !win.navigator.onLine : false);

    if (win) {
      const onOffline = (): void => this.offline.set(true);
      const onOnline = (): void => this.offline.set(false);

      win.addEventListener('offline', onOffline);
      win.addEventListener('online', onOnline);

      this.destroyRef.onDestroy(() => {
        win.removeEventListener('offline', onOffline);
        win.removeEventListener('online', onOnline);
      });
    }

    if (this.swUpdate?.isEnabled) {
      this.updateSubscription = this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          this.updateReady.set(true);
        }
      });
    }

    this.destroyRef.onDestroy(() => this.updateSubscription?.unsubscribe());
  }

  activateUpdate(): void {
    if (!this.swUpdate) return;

    void this.swUpdate.activateUpdate().then(() => {
      this.document.defaultView?.location.reload();
    });
  }
}
