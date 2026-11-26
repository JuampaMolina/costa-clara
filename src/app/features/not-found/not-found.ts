import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main class="grid min-h-dvh place-items-center bg-slate-50 px-4 text-slate-900">
      <div
        class="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm"
      >
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sea-600">Error 404</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight">Esta playa no está en el mapa</h1>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          La página que buscas no existe o ha cambiado de sitio. Vuelve al mapa para seguir
          explorando las playas de Baleares.
        </p>
        <a
          routerLink="/"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Volver al mapa
          <svg
            viewBox="0 0 24 24"
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </div>
    </main>
  `,
})
export class NotFound {}
