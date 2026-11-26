# Costa Clara — Handoff para el siguiente agente

> Lee esto antes de tocar código. La app está desplegada, con CI/CD y e2e. El siguiente bloque de trabajo es el importador de datos reales; el plan completo está en [BACKLOG.md](./BACKLOG.md).

## Qué es

Observatorio de playas y calidad del agua de Baleares: mapa interactivo, filtros, ficha de playa y estado compartible por URL.

- **Estado:** v0.2 · datos de demostración · desplegada.
- **Demo:** <https://costa-clara-k23.pages.dev>
- **Repo:** <https://github.com/JuampaMolina/costa-clara>
- **Local:** `C:\Users\Juampa\.t3\projects\costa-clara`
- **Usuario:** Juan Pastor Ruiz Molina (`JuampaMolina` en GitHub).

## Stack

- Angular 22.3 (standalone, signals, control flow)
- OpenLayers 10
- Tailwind CSS 4 vía PostCSS
- Vitest (unitarios) + Playwright (e2e)
- Wrangler (deploy)
- GitHub Actions + Cloudflare Pages
- npm (no pnpm)

## Cómo ejecutarlo

Node está en `C:\Program Files\nodejs` pero **no está en el PATH** de esta máquina. Añádelo al PATH o usa la ruta completa:

```powershell
$env:Path = 'C:\Program Files\nodejs;C:\Program Files\Git\cmd;' + $env:Path
Set-Location 'C:\Users\Juampa\.t3\projects\costa-clara'
npm start -- --port 4200
```

Abre **http://localhost:4200** (no `127.0.0.1`).

```powershell
npm run build          # build de producción
npm test -- --watch=false
npm run test:e2e       # Playwright, desktop + móvil
npm run data:import    # importa data/raw y regenera el dataset
npm run data:example   # prueba el importador con el fixture
npm run deploy         # build + deploy manual (requiere token de Cloudflare)
```

## Qué funciona (v0.2)

- Mapa de Baleares con OpenLayers, clustering, capas base (mapa/relieve/satélite), geolocalización, pantalla completa y selección de playa.
- 19 playas reales en `src/app/core/data/beaches.seed.ts` (calidad y servicios de ejemplo).
- Filtros por texto, isla, calidad y bandera azul, sincronizados con la URL (`?q=&isla=&calidad=&bandera=&playa=`), con orden (`?orden=`) y contadores cross-filter.
- Búsqueda con debounce, apóstrofos y sinónimos baleares; panel “Más filtros” de servicios y accesibilidad (`?servicios=`, `?accesibilidad=`).
- Comparador de 0–3 playas con modal accesible y URL (`?comparar=`).
- Favoritos en `localStorage`, con filtro “Favoritas”, contador y sincronización entre pestañas.
- Ficha con calidad, servicios, última muestra, histórico con gráfica y tendencia, coordenadas, enlace a Google Maps y botón para compartir (Web Share API + portapapeles).
- Procedencia visible: demo/oficial, fuente, licencia y fecha de actualización.
- Importador CSV con validación (`npm run data:import`), fixture de ejemplo y fallback al seed.
- Leyenda, diseño responsive y estado vacío.
- Página 404 propia y título/descripción/Open Graph dinámicos al abrir una playa; imagen OG 1200×630.
- Tests: 80 unitarios y 62 e2e (31 flujos × desktop/móvil + axe, SEO y PWA).
- i18n ES/EN/CA con selector, `?lang=` y persistencia.
- Storybook 10 con 5 componentes y 20 stories (`npm run storybook`).
- PWA con banner offline y aviso de actualización; mar con viento real; sitemap regenerable.
- CI (`.github/workflows/ci.yml`) y deploy automático en `main` (`.github/workflows/deploy.yml`).

## Bugs conocidos

Ninguno en la v0.2. Si aparece uno, documéntalo aquí antes de arreglarlo.

## Git y despliegue

- `origin` → `https://github.com/JuampaMolina/costa-clara.git`, rama `main`.
- Cada push a `main` ejecuta **CI** y **Deploy** en paralelo. El deploy sube `dist/costa-clara/browser` al proyecto de Pages `costa-clara`.
- Secretos del repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. No se commitean.
- Detalles y rotación del token en [docs/despliegue.md](./docs/despliegue.md).
- `public/_redirects` da fallback SPA a `index.html`; sin él, recargar una URL con filtros daría 404.

## Estructura

```
src/app/
  core/
    data/beaches.ts            # selector: datos reales o seed
    data/beaches.generated.ts  # salida del importador (null = demo)
    data/beaches.seed.ts       # dataset de demostración
    models/beach.ts            # tipos, islas, calidades, colores, muestras
    services/favorites.ts      # favoritos en localStorage + tests
    utils/beach-filter.ts      # filtrado puro + tests
    utils/beach-history.ts     # muestras y tendencia + tests
    utils/data-import.ts       # validación del CSV + tests
    utils/geo.ts               # distancia Haversine + tests
  features/beaches/
    beaches-page.ts/html/scss  # estado, filtros, URL, títulos
    beach-map.ts               # OpenLayers: mapa, clustering, capas, ubicación
    beach-detail.ts            # ficha lateral
    beach-history.ts           # gráfica SVG del histórico
  features/not-found/
    not-found.ts               # 404
  app.ts / app.routes.ts       # shell y rutas
src/styles.css                 # Tailwind + estilos globales de OpenLayers
e2e/beaches.spec.ts            # flujos críticos con Playwright
playwright.config.ts
scripts/import-data.ts         # CLI del importador
data/raw/example/              # fixture CSV (no oficial)
data/README.md                 # esquema de datos
.github/workflows/             # ci.yml + deploy.yml
docs/datos.md                  # fuentes y licencias
docs/despliegue.md
BACKLOG.md                     # 36 tickets priorizados
```

## Próximos pasos

1. **Datos reales:** conectar la fuente oficial y regenerar el sitemap con el nuevo dataset.
2. **Backend opcional:** Supabase/PostGIS si el dataset crece; hoy todo es estático.
3. **Fotos:** añadir imágenes con licencia y AVIF/WebP.
4. **i18n del contenido:** traducir descripciones del dataset (hoy solo la UI).
5. **Mantenimiento:** CrUX/Lighthouse, dependencias y revisión de datos.

El backlog de 36 tickets está cerrado.

## Reglas y decisiones

- **Idioma de la UI:** español.
- **No inventar datos oficiales.** La calidad/servicios actuales son demo y deben seguir etiquetados como tales. Al conectar datos reales, cita la fuente y su licencia.
- **No añadir backend todavía.** El seed en TS es suficiente. Si se añade Supabase/PostGIS, documenta variables de entorno y no subas secretos.
- **No cambiar el stack** (Angular/OpenLayers/Tailwind) ni migrar a otro framework.
- **Tailwind 4** se configura con `.postcssrc.json` y `@import "tailwindcss"` en `src/styles.css`. No hace falta `tailwind.config.js`.
- **Presupuesto de bundle:** 700 kB warning / 1.2 MB error. Ahora mismo ~381 kB inicial + 330 kB de mapa diferido.
- **No tocar el CV** de `C:\Users\Juampa\.t3\projects\cv`; es otro repo.

## Criterio de “terminado”

- `npm run build`, `npm test -- --watch=false` y `npm run test:e2e` pasan.
- CI y Deploy en verde en GitHub Actions.
- La demo pública carga, mantiene los filtros al recargar y no tiene errores de consola.
- README, HANDOFF y BACKLOG reflejan el estado real.
