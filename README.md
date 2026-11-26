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
npm run test:e2e # tests e2e con Playwright (desktop + móvil)
npm run data:import  # importa data/raw y regenera el dataset
npm run data:example # prueba el importador con el fixture
npm run deploy   # build + deploy manual a Cloudflare Pages
```

## Despliegue

- **Producción:** <https://costa-clara-k23.pages.dev>
- **Cloudflare Pages** con deploy automático en cada push a `main` mediante [deploy.yml](./.github/workflows/deploy.yml).
- Build: `npm run build` → `dist/costa-clara/browser`.
- Rutas SPA: `public/_redirects` (recargar `?isla=mallorca` no da 404).
- Deploy manual: `npm run deploy` con `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en el entorno.

Instrucciones y rotación del token en [docs/despliegue.md](./docs/despliegue.md).

## Documentación

- [Caso de estudio](./docs/caso-de-estudio.md)
- [ADRs](./docs/adr/)
- [Fuentes de datos](./docs/datos.md)
- [Privacidad](./docs/privacidad.md)
- [Rendimiento](./docs/rendimiento.md)
- [Storybook](./docs/storybook.md)
- [Despliegue](./docs/despliegue.md)

## Qué hay hecho

- Mapa OpenLayers con clustering, capas base (mapa, relieve y satélite), geolocalización, pantalla completa y leyenda colapsable.
- Filtros por texto, isla, calidad y bandera azul, con orden y contadores cross-filter.
- Búsqueda con debounce, sinónimos baleares y panel de filtros avanzados (servicios y accesibilidad).
- Comparador de 0–3 playas con modal accesible y URL compartible.
- Estado de filtros y playa seleccionada en la URL (compartible).
- Ficha de playa con calidad, servicios, última muestra, histórico con gráfica, coordenadas y enlace a cómo llegar.
- Procedencia visible: datos demo u oficiales, fuente y licencia.
- Favoritos guardados en `localStorage` y enlace para compartir la ficha.
- Leyenda de calidad y diseño responsive.
- Página 404 propia, título y metadatos dinámicos por playa.
- Imagen OG 1200×630 y metas Open Graph/Twitter.
- Accesibilidad WCAG AA con axe, foco visible y `prefers-reduced-motion`.
- Estado del mar en la ficha (Open-Meteo Marine) y analítica sin cookies/PII.
- Reportar datos incorrectos y SEO técnico (sitemap, JSON-LD, canonical).
- PWA instalable con offline y carga diferida de ficha/comparador.
- Storybook con 5 componentes y 20 stories.
- Tests: 59 unitarios y 58 e2e (desktop y móvil).
- Importador CSV con validación, fixture y fallback al dataset demo.
- CI con tests, build y e2e; deploy automático en Cloudflare Pages.
- Dataset semilla de 19 playas reales (calidad y servicios de ejemplo).

## Próximos pasos

1. Conectar la fuente oficial y automatizar la actualización (CC-13).
2. PWA offline.
3. Comparador de playas.
4. Accesibilidad del mapa y auditoría axe.
5. Storybook para los componentes de UI.

El detalle, prioridades y criterios de aceptación están en [BACKLOG.md](./BACKLOG.md).

## Datos

Los nombres y las coordenadas son reales. La calidad, los servicios y las fechas son de demostración. Antes de publicar datos reales hay que citar la fuente oficial y su licencia.

El importador está en `npm run data:import`; el esquema y las fuentes candidatas están en [data/README.md](./data/README.md) y [docs/datos.md](./docs/datos.md).

## Licencia

MIT
