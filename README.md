# Costa Clara

[![CI](https://github.com/JuampaMolina/costa-clara/actions/workflows/ci.yml/badge.svg)](https://github.com/JuampaMolina/costa-clara/actions/workflows/ci.yml)
[![Deploy](https://github.com/JuampaMolina/costa-clara/actions/workflows/deploy.yml/badge.svg)](https://github.com/JuampaMolina/costa-clara/actions/workflows/deploy.yml)

Observatorio de playas y calidad del agua de Baleares. Un mapa interactivo para consultar el estado de las playas, sus servicios y su ubicación.

**Demo:** <https://costa-clara-k23.pages.dev>

> **Si eres el agente que continúa el proyecto, lee [HANDOFF.md](./HANDOFF.md) antes de tocar código.**

> **Estado:** v0.1 · datos de demostración. La calidad del agua, los servicios y las fechas son datos de ejemplo hasta conectar el importador de datos abiertos.

## Stack

- Angular 22 (standalone, signals, control flow)
- OpenLayers
- Tailwind CSS 4
- Vitest (tests unitarios)
- Playwright (e2e y capturas)
- GitHub Actions (CI/CD) + Cloudflare Pages

## Desarrollo

```bash
npm install
npm start
```

Abre `http://localhost:4200`.

## Scripts

```bash
npm start        # servidor de desarrollo
npm run build    # build de producción
npm test         # tests unitarios
npm run deploy   # build + deploy manual a Cloudflare Pages
```

## Despliegue

- **Producción:** <https://costa-clara-k23.pages.dev>
- **Cloudflare Pages** con deploy automático en cada push a `main` mediante [deploy.yml](./.github/workflows/deploy.yml).
- Build: `npm run build` → `dist/costa-clara/browser`.
- Rutas SPA: `public/_redirects` (recargar `?isla=mallorca` no da 404).
- Deploy manual: `npm run deploy` con `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en el entorno.

Instrucciones y rotación del token en [docs/despliegue.md](./docs/despliegue.md).

## Qué hay hecho

- Mapa de Baleares con clustering de playas.
- Filtros por texto, isla, calidad y bandera azul.
- Estado de filtros y playa seleccionada en la URL (compartible).
- Ficha de playa con calidad, servicios, última muestra, coordenadas y enlace a cómo llegar.
- Leyenda de calidad y diseño responsive.
- Dataset semilla de 19 playas reales (calidad y servicios de ejemplo).

## Próximos pasos

1. Importador de datos abiertos (CSV/JSON) y modelo de datos definitivo.
2. Ficha completa con histórico de calidad y gráficas.
3. Favoritos + PWA offline.
4. Tests e2e con Playwright.
5. Accesibilidad del mapa (navegación por teclado y alternativa textual).
6. Storybook para los componentes de UI.

## Datos

Los nombres y las coordenadas son reales. La calidad, los servicios y las fechas son de demostración. Antes de publicar datos reales hay que citar la fuente oficial y su licencia.

## Licencia

MIT
