# Rendimiento y presupuesto de bundle (CC-41)

**Última medición:** 2026-11-26 · `npm run build` (Angular 22.3, `@angular/build:application`, producción).

## Medición antes / después

| Estado                              | `main` (raw / transfer)                      | `styles` (raw / transfer) | **Total inicial (raw / transfer)** | Chunks diferidos (lazy)                                                                  | Margen vs. 700 kB |
| ----------------------------------- | -------------------------------------------- | ------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- | ----------------- |
| **Antes** (línea base)              | 655.38 kB / 167.18 kB                        | 39.62 kB / 7.02 kB        | **695.00 kB / 174.19 kB**          | —                                                                                        | −5.00 kB          |
| `@defer` solo comparador            | 496.28 kB + 154.63 kB / 124.05 kB + 46.09 kB | 39.77 kB / 7.02 kB        | **690.68 kB / 177.16 kB**          | `beach-compare` (16.86 kB / 4.55 kB)                                                     | −9.32 kB          |
| `@defer` comparador + ficha         | 641.18 kB / 163.93 kB                        | 39.77 kB / 7.02 kB        | **680.95 kB / 170.94 kB**          | `beach-detail` (19.01 kB / 6.00 kB), `beach-compare` (17.28 kB / 4.68 kB), común (482 B) | −19.05 kB         |
| **Después** (`@defer` + PWA SW)     | 647.30 kB / 165.44 kB                        | 39.77 kB / 7.02 kB        | **687.08 kB / 172.46 kB**          | `beach-detail` (19.01 kB / 5.98 kB), `beach-compare` (17.28 kB / 4.70 kB), común (482 B) | **−12.92 kB**     |
| **Después + mapa diferido** (CC-52) | 337.43 kB / 88.06 kB                         | 40.45 kB / 7.08 kB        | **377.88 kB / 95.14 kB**           | `beach-map` 329.54 kB, `beach-detail` 19.41 kB, `beach-compare` 18.65 kB, común 482 B    | **−322.12 kB**    |

### Desglose de chunks finales

- **Iniciales:**
  - `main-*.js`: 647.30 kB raw (165.44 kB estimado transferido)
  - `styles-*.css`: 39.77 kB raw (7.02 kB estimado transferido)
- **Diferidos (cargados bajo demanda):**
  - `beach-detail`: 19.01 kB raw (5.98 kB transferido) — incluye la ficha de playa, la gráfica SVG `BeachHistory` y `MarineWeatherService`.
  - `beach-compare`: 17.28 kB raw (4.70 kB transferido) — modal accesible de comparativa 2–3 playas.
  - Chunk compartido (`beach-history` util): 482 bytes.

## Estrategia de carga diferida

1. **Comparador (`<app-beach-compare>`) con `@defer (on immediate)` dentro de su `@if`:** el modal no se muestra en la carga inicial salvo URL con `?comparar=`, así que su código solo se descarga al abrir la comparativa. Mantiene `@placeholder`, `@loading (after 100ms; minimum 150ms)` y `@error` con botón de cierre para no dejar el fondo `inert` bloqueado en caso de fallo de red.
2. **Ficha de playa (`<app-beach-detail>`) con `@defer (on immediate)` dentro de su `@if`:** al diferir la ficha completa también salen del bundle inicial `BeachHistory` y `MarineWeatherService`, compensando el coste del runtime de `@defer` y de `provideServiceWorker` (+6.13 kB raw) y logrando una reducción neta tanto en tamaño raw (−7.92 kB) como en transferencia (−1.73 kB).
3. **Mapa diferido (`<app-beach-map>`) con `@defer (on immediate)`:** al incorporar i18n (CC-52), OpenLayers se extrae a un chunk de 329.54 kB que se carga inmediatamente después del primer render. El panel de filtros/listado pinta primero y el placeholder mantiene el alto (`min-h-[420px]`), evitando saltos de layout. Es el mayor recorte del bundle inicial (377.88 kB) a cambio de que el canvas aparezca unas décimas después; los e2e siguen verificando que el mapa está presente.

## Presupuesto de bundle

En [`angular.json`](../angular.json) el presupuesto de producción exige:

- **Bundle inicial (`initial`):** aviso a partir de **700 kB** (`maximumWarning: "700kB"`) y error a partir de **1.2 MB** (`maximumError: "1.2MB"`).
- **Estilos de componente (`anyComponentStyle`):** aviso a partir de **4 kB** y error a partir de **8 kB**.

Con **377.88 kB raw iniciales** tras el mapa diferido y los diccionarios i18n, el build de producción termina sin avisos de presupuesto y conserva 322.12 kB de margen antes del umbral de warning. El chunk del mapa (329.54 kB) se carga aparte y no cuenta en el inicial.

## Validación en producción (2026-11-26)

Medido con **Lighthouse 13.6** contra `https://costa-clara-k23.pages.dev` (móvil, headless, Chromium de Playwright), con el build final (i18n + mapa diferido):

| Métrica        | Valor     |
| -------------- | --------- |
| Performance    | **100**   |
| Accessibility  | **100**   |
| Best practices | **100**   |
| SEO            | **100**   |
| LCP            | **1,3 s** |
| TBT            | **30 ms** |
| FCP            | **1,3 s** |
| CLS            | **0**     |

**PWA / offline:** `navigator.serviceWorker.ready` = `ready`, controlador activo tras recarga y recarga con red desactivada mostrando el shell y las **19 playas**, sin errores de consola. Lighthouse 13 ya no incluye la categoría PWA; la instalabilidad se valida con manifest 192/512 `maskable`, service worker registrado y HTTPS de Cloudflare Pages.

> Valores de una ejecución de laboratorio; no sustituyen datos de campo (CrUX).
