# Storybook en Costa Clara

Catálogo interactivo de componentes UI de Costa Clara construido con **Storybook 10** (`@storybook/angular-vite`) sobre Angular 22 (zoneless) y Tailwind CSS v4.

## Comandos

```bash
# Arrancar servidor de desarrollo en http://localhost:6006
npm run storybook

# Generar build estático en storybook-static/
npm run build-storybook
```

## Configuración y addons

- **Framework**: `@storybook/angular-vite` (compila componentes standalone de Angular 22 e importa `src/styles.css` desde `.storybook/preview.ts` para cargar Tailwind CSS v4 y `ol/ol.css` de forma consistente en cualquier SO).
- **Patrón de stories**: `../src/**/*.stories.ts` configurado en `.storybook/main.ts`.
- **Addons**:
  - **Core de Storybook 10** (sustituye al antiguo `@storybook/addon-essentials`, integrado en el núcleo desde Storybook 9/10): Controls, Actions, Viewport, Backgrounds, Measure, Outline y Toolbars.
  - **`@storybook/addon-a11y`**: auditoría de accesibilidad (`axe-core`) en el panel _Accessibility_.
  - **`@storybook/addon-docs`**: documentación automática (`tags: ['autodocs']`).
- **Viewports**: `.storybook/preview.ts` registra presets de Costa Clara (`Móvil 390×844`, `Tablet 768×1024`, `Escritorio 1280×800`) además de `INITIAL_VIEWPORTS`.

## Piezas cubiertas

| Componente     | Archivo                                             | Estados incluidos                                                               |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `BeachHistory` | `src/app/features/beaches/beach-history.stories.ts` | `ConHistorico` (mejora), `TendenciaEmpeora`, `UnaSolaMuestra`, `Vacio`, `Movil` |
| `BeachDetail`  | `src/app/features/beaches/beach-detail.stories.ts`  | `Normal`, `FavoritaYComparada`, `SinServiciosYDemo`, `Movil`                    |
| `BeachCompare` | `src/app/features/beaches/beach-compare.stories.ts` | `DosPlayas`, `TresPlayas`, `SinServicios`, `Movil` (tarjetas apiladas)          |
| `NotFound`     | `src/app/features/not-found/not-found.stories.ts`   | `Default`, `Movil`                                                              |
| `BeachMap`     | `src/app/features/beaches/beach-map.stories.ts`     | `ConPlayas`, `PlayaSeleccionada`, `Vacio`, `ConUbicacionUsuario`, `Movil`       |

## Mocks y aislamiento sin red

Los fixtures y factories de mocks viven en `src/stories/beach-fixtures.ts` para reutilizar los componentes reales sin duplicar markup ni tocar servicios de la aplicación:

- **`BeachDetail`**: usa `applicationConfig` con mocks en memoria de `FavoritesStore` (sin tocar `localStorage`), `MarineWeatherService` (sin peticiones HTTP a Open-Meteo) y `AnalyticsService`.
- **`BeachCompare`**: usa `applicationConfig` con un mock sin efectos de `AnalyticsService`.
- **`NotFound`**: registra `provideRouter([])` mediante `applicationConfig` para que `RouterLink` funcione de forma aislada.
- **`BeachMap`**: es viable directamente en Storybook porque no tiene dependencias inyectadas y monta OpenLayers sobre el canvas del contenedor. Las capas vectoriales (marcadores por calidad, clusters, selección, ubicación del usuario), los controles de zoom/escala y el selector de capa base funcionan también sin red sobre el fondo azul de respaldo (`#dbeafe`); las teselas externas (OSM, OpenTopoMap, Esri) solo se descargan si hay conexión.

## Convenciones para nuevas stories

1. Colocar cada archivo junto a su componente (`*.stories.ts`).
2. Importar siempre `Meta`, `StoryObj` y decoradores desde `@storybook/angular-vite`.
3. Usar `applicationConfig` para sustituir servicios con efectos de red o almacenamiento.
4. En componentes con posicionamiento `fixed` o `absolute`, definir `parameters.layout = 'fullscreen'` y `parameters.docs.story = { inline: false }` para que no bloqueen la vista de Docs.
