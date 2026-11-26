# Costa Clara — Handoff para el siguiente agente

> Lee esto antes de tocar código. El proyecto está a medias a propósito: la base funciona, pero hay dos bugs visuales conocidos y nada desplegado todavía.

## Qué es

Observatorio de playas y calidad del agua de Baleares: mapa interactivo, filtros, ficha de playa y estado compartible por URL.

**Estado:** v0.1 · datos de demostración.
**Repo:** `C:\Users\Juampa\.t3\projects\costa-clara`
**Usuario:** Juan Pastor Ruiz Molina.

## Stack

- Angular 22.3 (standalone, signals, control flow)
- OpenLayers 10
- Tailwind CSS 4 vía PostCSS
- Vitest (unitarios)
- Playwright (instalado para e2e/capturas)
- npm (no pnpm)

## Cómo ejecutarlo

Node está en `C:\Program Files\nodejs` pero **no está en el PATH** de esta máquina. Añádelo al PATH o usa la ruta completa:

```powershell
$env:Path = 'C:\Program Files\nodejs;C:\Program Files\Git\cmd;' + $env:Path
Set-Location 'C:\Users\Juampa\.t3\projects\costa-clara'
npm start -- --port 4200
```

Abre **http://localhost:4200** (no `127.0.0.1`: el dev server escucha en `localhost`).

```powershell
npm run build
npm test -- --watch=false
```

## Qué funciona

- Mapa de Baleares con OpenLayers y tiles de OSM.
- 19 playas reales en `src/app/core/data/beaches.seed.ts` (calidad y servicios de ejemplo).
- Filtros por texto, isla, calidad y bandera azul.
- Filtros y playa seleccionada sincronizados con la URL (`?q=&isla=&calidad=&bandera=&playa=`).
- Ficha de playa con calidad, servicios, última muestra, coordenadas y enlace a Google Maps.
- Leyenda, diseño responsive y estados vacíos.
- 8 tests unitarios pasando.
- Build de producción pasando.

## Bugs conocidos (arreglar primero)

1. **Los marcadores de playas no se ven en el mapa.**
   - Las features parecen añadirse al `Cluster` source, pero no se pinta ninguna.
   - Hay un `console.log('[map] features', ...)` temporal en `src/app/features/beaches/beach-map.ts`; úsalo para comprobar cuántas features hay y quítalo al terminar.
   - Revisa: orden/Z-index de capas, `styleFn`, geometrías en EPSG:3857 y que el `effect` se ejecute después de `mapReady`.
   - La captura de referencia mostraba el mapa y la lista, pero ningún punto.

2. **Panel blanco a la derecha del mapa.**
   - Es el control de atribución de OpenLayers (`.ol-attribution`), mal posicionado por el CSS global de `src/styles.css`.
   - Ahora mismo ocupa una franja vertical blanca desde `top: 3.35rem` hasta abajo.
   - Arregla el posicionamiento (por ejemplo, abajo a la derecha) sin tapar la ficha ni la leyenda. No ocultes la atribución de OSM.

3. **Restos del scaffold.**
   - `src/app/app.html` sigue existiendo pero ya no se usa (`app.ts` tiene template inline). Bórralo.
   - `diag.mjs` era un script temporal de diagnóstico y ya se ha eliminado.
   - `README.md` es la descripción del proyecto; este archivo es el handoff.

## Git

Hay un solo commit (`chore: scaffold Angular app`). **Todo el trabajo de la v0.1 está sin commitear.** Haz un commit limpio antes de empezar a cambiar cosas:

```powershell
git add -A
git commit -m "feat: mapa, filtros, ficha y datos semilla"
```

## Estructura

```
src/app/
  core/
    data/beaches.seed.ts       # dataset de demostración
    models/beach.ts            # tipos, islas, calidades, colores
    utils/beach-filter.ts      # filtrado puro + tests
  features/beaches/
    beaches-page.ts/html/scss  # estado, filtros, URL, layout
    beach-map.ts               # OpenLayers: mapa, clustering, selección
    beach-detail.ts            # ficha lateral
  app.ts / app.routes.ts       # shell y ruta principal
src/styles.css                 # Tailwind + estilos globales de OpenLayers
```

## Próximos pasos (en orden)

1. Arreglar los dos bugs visuales y verificar con Playwright a 1440px y 390px.
2. Commit de la v0.1.
3. Importador de datos abiertos: CSV/JSON → modelo `Beach`, con validación y fuente/licencia documentadas. Mantener el dataset semilla como fallback.
4. Tests e2e de los flujos críticos: buscar, filtrar, seleccionar playa, recargar URL.
5. CI con GitHub Actions + deploy en Cloudflare Pages.
6. Histórico de calidad y gráficas en la ficha.
7. Favoritos + PWA offline.
8. Accesibilidad del mapa (teclado, foco, alternativa textual) y auditoría axe.
9. Storybook para 4-6 componentes de UI.
10. Caso de estudio para el portfolio (problema, decisiones, trade-offs, métricas).

## Reglas y decisiones

- **Idioma de la UI:** español.
- **No inventar datos oficiales.** La calidad/servicios actuales son demo y deben seguir etiquetados como tales. Al conectar datos reales, cita la fuente y su licencia.
- **No añadir backend todavía.** El seed en TS es suficiente para la v0.1. Si se añade Supabase/PostGIS, documenta variables de entorno y no subas secretos.
- **No cambiar el stack** (Angular/OpenLayers/Tailwind) ni migrar a otro framework.
- **Tailwind 4** se configura con `.postcssrc.json` y `@import "tailwindcss"` en `src/styles.css`. No hace falta `tailwind.config.js`.
- **Presupuesto de bundle:** 700 kB warning / 1.2 MB error. OpenLayers pesa; no lo metas en un chunk inicial extra si se puede evitar.
- **No tocar el CV** de `C:\Users\Juampa\.t3\projects\cv`; es otro repo.

## Criterio de “terminado” para la v0.1

- `npm run build` y `npm test -- --watch=false` pasan.
- Se ven los marcadores y no hay panel blanco.
- Filtros, URL y ficha funcionan en desktop y móvil.
- Consola sin errores.
- README actualizado y deploy público con URL.
