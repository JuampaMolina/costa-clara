# Backlog de Costa Clara

Listado de tickets para evolucionar la app desde la v0.1 actual hasta una v1.0 publicable y presentable en portfolio.

> **Contexto:** v0.1 con 19 playas de demostración, mapa OpenLayers con clustering, filtros sincronizados con la URL y ficha lateral. Sin backend, sin deploy y sin e2e todavía.

**Estado:** 36/36 cerrados · actualizado 2026-11-26.

## Hecho

- ✅ **CC-01** Deploy en Cloudflare Pages (auto-deploy desde `main`).
- ✅ **CC-02** CI con GitHub Actions (tests, build y e2e).
- ✅ **CC-03** Playwright configurado + 30 e2e (desktop y móvil).
- ✅ **CC-04** README, HANDOFF y BACKLOG al día.
- ✅ **CC-05** ESLint 10 + Prettier + axe en CI.
- ✅ **CC-06** 404 propia, títulos y metadatos dinámicos.
- ✅ **CC-10** Fuentes y licencias documentadas en `docs/datos.md`.
- ✅ **CC-11** Modelo v1 con muestras, servicios tipados y procedencia.
- ✅ **CC-12** Importador CSV validado + ejemplo y fallback al seed.
- ✅ **CC-13** Workflow mensual de importación y PR automático.
- ✅ **CC-14** Histórico de muestras por playa.
- ✅ **CC-15** Procedencia demo/oficial, fuente y licencia en la ficha.
- ✅ **CC-16** Tests del importador con casos válidos y errores.
- ✅ **CC-20** Gráfica SVG del histórico y tendencia.
- ✅ **CC-21** Comparador 0–3 con modal accesible y URL.
- ✅ **CC-22** Favoritos con `localStorage`, filtro y sincronización entre pestañas.
- ✅ **CC-23** Orden y contadores cross-filter en islas y calidad.
- ✅ **CC-24** Búsqueda con debounce, apóstrofos y sinónimos baleares.
- ✅ **CC-25** Filtros avanzados de servicios y accesibilidad.
- ✅ **CC-26** Compartir ficha con Web Share API y fallback al portapapeles.
- ✅ **CC-27** Estado del mar con Open-Meteo Marine en la ficha.
- ✅ **CC-28** Reportar un dato con issue prellenada.
- ✅ **CC-43** Analítica sin cookies/PII con eventos locales y Plausible opcional.
- ✅ **CC-30** Geolocalización, orden por distancia y marcador de posición.
- ✅ **CC-31** Capas base: mapa, relieve y satélite con atribución.
- ✅ **CC-32** Leyenda colapsable y mapa a pantalla completa.
- ✅ **CC-33** Sincronía lista↔mapa con marcador resaltado.
- ✅ **CC-34** Alternativa textual, live regions y foco en el mapa.
- ✅ **CC-40** PWA instalable, service worker y offline validado.
- ✅ **CC-41** Carga diferida y Lighthouse 98/100/100/100.
- ✅ **CC-42** Imagen OG 1200×630 y metas Open Graph/Twitter.
- ✅ **CC-50** Auditoría axe WCAG AA, foco, contraste y reduced motion.
- ✅ **CC-51** Storybook 10 con 5 componentes y 20 stories.
- ✅ **CC-52** i18n ES/EN/CA con selector, `?lang=` y persistencia.
- ✅ **CC-53** robots, sitemap, JSON-LD, canonical y og:url.
- ✅ **CC-54** Caso de estudio y 4 ADRs.

## Cómo leer esto

| Campo | Valores |
| --- | --- |
| **Prioridad** | `P0` bloquea publicar · `P1` siguiente iteración · `P2` mejora deseable |
| **Tamaño** | `S` ≤ 4 h · `M` 1–2 días · `L` 3–5 días |
| **Depende** | Tickets que conviene cerrar antes |

Reglas del proyecto que aplican a todos los tickets: UI en español, no inventar datos oficiales (todo dato real debe citar fuente y licencia), no añadir backend sin documentarlo, no cambiar el stack, y no tocar el repo del CV.

---

## Resumen por épica

| Épica | Tickets | P0 | P1 | P2 |
| --- | --- | --- | --- | --- |
| E0 · Fundaciones y publicación | 6 | 4 | 2 | 0 |
| E1 · Datos reales | 7 | 3 | 4 | 0 |
| E2 · Producto y ficha | 9 | 0 | 6 | 3 |
| E3 · Mapa | 5 | 0 | 3 | 2 |
| E4 · PWA y rendimiento | 4 | 0 | 1 | 3 |
| E5 · Calidad y portfolio | 5 | 0 | 3 | 2 |
| **Total** | **36** | **7** | **19** | **10** |

## Roadmap sugerido

| Sprint | Objetivo | Tickets |
| --- | --- | --- |
| **Sprint 1 · Publicar** | URL pública, CI verde y red de seguridad e2e | CC-01, CC-02, CC-03, CC-06 |
| **Sprint 2 · Datos reales** | Sustituir el seed por un pipeline trazable | CC-10, CC-11, CC-12, CC-15, CC-16 |
| **Sprint 3 · Producto** | Histórico, favoritos, compartir y comparador | CC-14, CC-20, CC-22, CC-26, CC-23 |
| **Sprint 4 · Pulido** | Accesibilidad, PWA, rendimiento y portfolio | CC-34, CC-50, CC-40, CC-41, CC-54 |

---

## E0 · Fundaciones y publicación

### CC-01 · Desplegar en Cloudflare Pages · P0 · M
**Estado:** ✅ Hecho (2026-11-26) · <https://costa-clara-k23.pages.dev>
**Qué:** conectar el repo a Cloudflare Pages con build `npm run build` y salida `dist/costa-clara/browser`, preview por PR y producción en `main`.
**Hecho cuando:**
- URL pública estable en producción y una preview por PR.
- `_redirects` o regla SPA para que `/?isla=mallorca` y rutas profundas no den 404.
- Cabeceras de cache razonables para assets con hash.
**Depende:** repo en GitHub (crear remoto si aún no existe).

### CC-02 · CI con GitHub Actions · P0 · S
**Estado:** ✅ Hecho (2026-11-26) · tests, build y e2e en cada push/PR.
**Qué:** workflow en `.github/workflows/ci.yml` que en cada push/PR ejecute instalación con cache, tests unitarios, build de producción y (cuando exista) e2e.
**Hecho cuando:**
- El check es obligatorio para mergear.
- Falla si un test, el build o el presupuesto de bundle se rompen.
**Depende:** CC-03 para incluir e2e en el mismo workflow.

### CC-03 · Configurar Playwright y e2e de flujos críticos · P0 · M
**Estado:** ✅ Hecho (2026-11-26) · 15 flujos ×2 (30 e2e).
**Qué:** `playwright.config.ts` con `webServer` sobre `ng serve`, proyectos desktop y móvil, y specs de: buscar, filtrar por isla/calidad/bandera, seleccionar playa, recargar URL y estado vacío.
**Hecho cuando:**
- `npx playwright test` pasa en local y en CI.
- Hay capturas en fallo y trazas solo en el primer reintento.
- Se comprueba que no hay errores de consola en los flujos.
**Nota:** Playwright ya está instalado, falta configuración y specs.

### CC-04 · Documentación viva · P0 · S
**Estado:** ✅ Hecho (2026-11-26).
**Qué:** actualizar `README.md` y `HANDOFF.md` al estado real (bugs cerrados, commits, URL de deploy) y convertir el handoff en guía de contribución en vez de diario de una sesión.
**Hecho cuando:**
- README incluye URL pública, scripts, stack y limitaciones de datos.
- No quedan referencias a bugs ya arreglados ni a scripts temporales.

### CC-05 · Lint y formato en CI · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · ESLint 10 + angular-eslint 22 + Prettier + axe.
**Qué:** añadir ESLint (config Angular + TS) y usar Prettier ya instalado; scripts `lint` y `format:check`.
**Hecho cuando:**
- `npm run lint` y `npm run format:check` pasan y están en CI.
- Reglas mínimas: imports sin usar, `console.log` prohibido en `src/` salvo logger, orden de imports.

### CC-06 · 404, títulos y metadatos base · P0 · S
**Estado:** ✅ Hecho (2026-11-26) · pendiente canonical y sitemap (CC-53).
**Qué:** ruta wildcard con página 404 útil, `TitleStrategy` para títulos por ruta/playa, descripción, canonical y Open Graph básicos.
**Hecho cuando:**
- Una URL inválida muestra una página con enlace al mapa.
- El título cambia al seleccionar playa (`Es Trenc · Costa Clara`).
- Compartir la home muestra título, descripción e imagen.

---

## E1 · Datos reales

### CC-10 · Investigar fuentes y licencias · P0 · M
**Estado:** ✅ Hecho (2026-11-26) · `docs/datos.md` con candidatas y checklist.
**Qué:** documentar en `docs/datos.md` las fuentes candidatas y su licencia antes de escribir código: calidad de aguas de baño (MITECO / sistema de información de aguas de baño y organismos de Baleares), bandera azul (ADEAC), cartografía (IDEIB) y mapa base (OSM). Verificar formato, frecuencia y condiciones de reutilización.
**Hecho cuando:**
- Tabla con fuente, URL, licencia, formato, frecuencia y campos disponibles.
- Decisión razonada de fuente principal y plan B.
- Queda claro qué datos son obligatorios y cuáles opcionales.

### CC-11 · Modelo de datos v1 · P0 · M
**Estado:** ✅ Hecho (2026-11-26) · `samples`, `source`, `dataStatus`, servicios tipados.
**Qué:** evolucionar `Beach` a un modelo con procedencia: `samples[]` (fecha, calidad, fuente), `services[]` tipados, `accessibility`, `blueFlagYear`, `source`, `license`, `updatedAt`, `dataStatus: 'demo' | 'real'`.
**Hecho cuando:**
- Tipos en `core/models` sin `any` y con uniones cerradas.
- El seed se adapta al modelo sin romper filtros ni ficha.
- Tests de normalización de calidad y fechas.

### CC-12 · Importador CSV/JSON con validación · P0 · L
**Estado:** ✅ Hecho (2026-11-26) · `npm run data:import` / `npm run data:example`.
**Qué:** script `npm run import:data` que lea un fichero en `data/raw/`, valide campos, normalice islas/municipios/calidades, deduplique por nombre+coordenadas y genere `src/app/core/data/beaches.generated.ts` (o JSON versionado).
**Hecho cuando:**
- Un CSV/JSON inválido falla con errores claros por fila y no genera salida.
- La salida es determinista (mismo input → mismo output) y está formateada.
- El seed demo se mantiene como fallback si no hay datos reales.

### CC-13 · Actualización programada y snapshot · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · workflow mensual + PR; fetch oficial pendiente de CC-10.
**Qué:** workflow mensual que descarga la fuente, ejecuta el importador, valida y abre PR automático si hay cambios; guardar histórico de snapshots.
**Hecho cuando:**
- Un PR automático muestra el diff de datos y pasa CI.
- Si la fuente cambia de formato, el workflow falla de forma visible (issue o check rojo), no publica datos vacíos.
**Depende:** CC-10, CC-12.

### CC-14 · Histórico de muestras por playa · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · últimas 3 muestras + tendencia.
**Qué:** almacenar y mostrar la serie de muestras por playa, no solo la última.
**Hecho cuando:**
- La ficha lista las últimas N muestras con fecha y calidad.
- Hay un indicador de tendencia (mejora/empeora/estable) con criterio documentado.

### CC-15 · Procedencia visible en la UI · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · badge demo/oficial y fuente con licencia.
**Qué:** sustituir el badge fijo “Datos de demostración” por un estado derivado: banner ámbar si `dataStatus === 'demo'`, y pie de ficha con fuente, licencia y fecha de actualización cuando sea real.
**Hecho cuando:**
- Es imposible confundir datos demo con datos oficiales.
- Cada muestra enlaza a su fuente.

### CC-16 · Tests del importador · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · 7 casos de validación.
**Qué:** fixtures pequeños (válido, con acentos, duplicado, calidad desconocida, coordenada fuera de Baleares) y tests unitarios del pipeline.
**Hecho cuando:**
- Cobertura de las ramas de error y de normalización.
- Los fixtures no contienen datos personales ni ficheros grandes.

---

## E2 · Producto y ficha

### CC-20 · Gráfica del histórico de calidad · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · SVG propio, sin dependencias extra.
**Qué:** gráfica de la serie de muestras en la ficha. Preferible SVG propio o una librería ligera; no meter otra dependencia pesada sin justificarlo.
**Hecho cuando:**
- Se ve la evolución con eje temporal y colores de calidad accesibles (no solo color: también forma/etiqueta).
- Funciona en móvil y con `prefers-reduced-motion`.

### CC-21 · Comparador de playas · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · 0–3, modal accesible y `?comparar=`.
**Qué:** seleccionar 2–3 playas y comparar calidad, servicios, bandera azul, municipio y última muestra en una vista/tabla.
**Hecho cuando:**
- La selección se puede compartir por URL (`?comparar=id1,id2`).
- En móvil la tabla se convierte en tarjetas apiladas.

### CC-22 · Favoritos · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · localStorage, filtro y sync entre pestañas.
**Qué:** marcar playas como favoritas en `localStorage`, filtro “Favoritas” y contador. Sin cuentas ni backend.
**Hecho cuando:**
- Persisten tras recargar y se sincronizan entre pestañas (`storage` event).
- Hay estado vacío que explica cómo añadir favoritas.
- El corazón tiene `aria-pressed` y nombre accesible.

### CC-23 · Ordenación y facetas · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · `?orden=` y contadores cross-filter.
**Qué:** ordenar resultados (nombre, isla, calidad, última muestra) y mostrar contadores por isla/calidad en los filtros.
**Hecho cuando:**
- El orden elegido se refleja en la URL y en la lista.
- Los contadores respetan el resto de filtros activos.

### CC-24 · Búsqueda robusta · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · debounce 250 ms, apóstrofos y sinónimos.
**Qué:** búsqueda insensible a mayúsculas y acentos, tolerante a “platja/playa/cala”, con debounce y limpieza.
**Hecho cuando:**
- “formentera”, “Formentera” y “fòrmentera” dan el mismo resultado.
- Escribir rápido no dispara navegaciones de URL por cada tecla.

### CC-25 · Filtros avanzados · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · servicios derivados + accesibilidad con `?servicios=`/`?accesibilidad=`.
**Qué:** filtrar por servicios (socorrista, acceso adaptado, chiringuito, aparcamiento…), accesibilidad y tipo de playa, con panel colapsable.
**Hecho cuando:**
- Los servicios se derivan del dataset, no están hardcodeados en la vista.
- Los filtros se combinan con los existentes y se pueden limpiar de una vez.

### CC-26 · Compartir ficha · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · Web Share API + copia al portapapeles.
**Qué:** botón compartir con Web Share API y fallback “copiar enlace”, compartiendo la URL con `?playa=`.
**Hecho cuando:**
- En móvil abre la hoja nativa; en desktop copia y confirma visualmente.
- El enlace abierto en otro dispositivo centra el mapa y abre la ficha.

### CC-27 · Estado del mar y meteorología · P2 · M
**Estado:** ✅ Hecho (2026-11-26) · Open-Meteo Marine + viento, bloque resiliente y atribución.
**Qué:** integración con una API abierta (por ejemplo Open-Meteo marino/meteo o AEMET si su licencia lo permite) para oleaje, viento y temperatura en la ficha.
**Hecho cuando:**
- Se muestra “actualizado a las HH:MM” y la fuente.
- Si la API falla, la ficha sigue funcionando sin el bloque.
- No se guardan claves en el cliente.

### CC-28 · Reportar dato incorrecto · P2 · S
**Estado:** ✅ Hecho (2026-11-26) · issue prellenada con playa, campo y URL.
**Qué:** enlace en la ficha para reportar un dato (formulario `mailto:` o issue prellenada), con playa y campo en el mensaje.
**Hecho cuando:**
- El reporte incluye id de playa, campo y URL.
- Hay texto de qué pasa después y no se piden datos personales innecesarios.

---

## E3 · Mapa

### CC-30 · Geolocalización y “cerca de mí” · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · orden por distancia y marcador azul.
**Qué:** botón de ubicación con permiso explícito, ordenar por distancia y centrar el mapa.
**Hecho cuando:**
- Sin permiso o con error se muestra un aviso claro y la app sigue usable.
- La distancia se calcula con Haversine y se muestra en km.
- No se envía la ubicación a ningún servidor.

### CC-31 · Capas base alternativas · P2 · M
**Estado:** ✅ Hecho (2026-11-26) · OSM, OpenTopoMap y Esri con atribución.
**Qué:** selector OSM / topográfico / satélite con atribución correcta y persistencia de la elección.
**Hecho cuando:**
- Cada capa muestra su atribución y cumple su licencia.
- Cambiar de capa no pierde centro, zoom ni selección.

### CC-32 · Leyenda y mapa a pantalla completa en móvil · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · leyenda cerrada por defecto en móvil.
**Qué:** leyenda colapsable, botón de pantalla completa y layout que no tape la ficha ni los controles.
**Hecho cuando:**
- En 390 px la leyenda no ocupa más de una línea cerrada.
- Salir de pantalla completa restaura el layout y el tamaño del mapa.

### CC-33 · Sincronía lista ↔ mapa · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · halo del marcador y scroll a la ficha/lista.
**Qué:** al seleccionar desde la lista, hacer scroll a la ficha y resaltar el marcador (halo/etiqueta); al seleccionar en el mapa, hacer scroll al item de la lista.
**Hecho cuando:**
- La selección es visible en ambos lados sin recargar.
- El scroll respeta `prefers-reduced-motion` y no secuestra el foco.

### CC-34 · Accesibilidad del mapa · P1 · L
**Estado:** ✅ Hecho (2026-11-26) · lista como alternativa, live regions y foco; axe en CC-50.
**Qué:** alternativa textual navegable (lista ya existente como base), navegación por teclado entre playas, `aria-live` al cambiar la selección y anuncio de resultados.
**Hecho cuando:**
- Se puede recorrer y seleccionar playas solo con teclado.
- El mapa no es la única vía para acceder a la información.
- Auditoría axe sin errores críticos en el flujo principal.

---

## E4 · PWA y rendimiento

### CC-40 · PWA instalable y offline · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · SW, manifest, iconos, banner offline y aviso de actualización.
**Qué:** manifest, iconos, service worker (Angular `ngsw` o Workbox) con shell offline y última respuesta de datos cacheada.
**Hecho cuando:**
- Lighthouse marca instalable.
- Sin red se abre la app y se ve el último dataset con aviso de “sin conexión”.
- Una versión nueva muestra aviso de actualización sin romper la sesión.

### CC-41 · Rendimiento y bundle · P2 · M
**Estado:** ✅ Hecho (2026-11-26) · 695→378 kB inicial + mapa diferido de 330 kB; Lighthouse 100, LCP 1,3 s, TBT 30 ms.
**Qué:** medir y reducir el peso inicial; valorar carga diferida de OpenLayers/mapa, tree-shaking de estilos y presupuesto más estricto.
**Hecho cuando:**
- Hay medición antes/después documentada (LCP, TBT, kB iniciales).
- El build no supera el presupuesto acordado y el mapa no bloquea el primer render de la lista.

### CC-42 · Imágenes de playas y OG images · P2 · M
**Estado:** ✅ Hecho (2026-11-26) · OG 1200×630 y metas; fotos de playas pendientes si se añaden.
**Qué:** si se añaden fotos, servirlas en AVIF/WebP con `srcset` y lazy loading; generar imagen OG por playa o una genérica cuidada.
**Hecho cuando:**
- Ninguna imagen bloquea el LCP ni se sirve a tamaño completo en móvil.
- Las fotos tienen autoría/licencia documentada.

### CC-43 · Analítica respetuosa con la privacidad · P2 · S
**Estado:** ✅ Hecho (2026-11-26) · sin cookies/PII; eventos locales y Plausible opcional.
**Qué:** analítica sin cookies (Plausible/Umami) o ninguna; medir búsquedas, filtros y fichas abiertas.
**Hecho cuando:**
- No hay cookies de terceros ni datos personales.
- Se documenta en privacidad qué se mide y por qué.

---

## E5 · Calidad y portfolio

### CC-50 · Auditoría de accesibilidad WCAG AA · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · 0 critical/serious; 46 e2e con axe.
**Qué:** axe + revisión manual de contraste, foco, labels, jerarquía de encabezados, zoom 200 % y lector de pantalla en el flujo principal.
**Hecho cuando:**
- 0 violaciones críticas/serias de axe en home, ficha y estados vacíos.
- Se corrige el foco al abrir/cerrar la ficha y se respeta `prefers-reduced-motion`.

### CC-51 · Storybook de componentes · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · Storybook 10.6.9, 5 componentes y 20 stories.
**Qué:** Storybook para 5–6 piezas: pill de filtro, item de lista, ficha, leyenda, estado vacío y badge de calidad.
**Hecho cuando:**
- Las stories cubren estados normal/vacío/seleccionado y móvil.
- `npm run storybook` y build estático funcionan.

### CC-52 · Internacionalización ES/EN/CA · P2 · L
**Estado:** ✅ Hecho (2026-11-26) · diccionarios ES/EN/CA, selector, `?lang=` y persistencia; datos del dataset sin traducir.
**Qué:** externalizar textos y añadir catalán e inglés con Angular i18n o un diccionario propio, manteniendo español por defecto.
**Hecho cuando:**
- No quedan textos hardcodeados en templates.
- El idioma se puede fijar por URL o preferencia y no rompe el SEO.

### CC-53 · SEO técnico · P1 · S
**Estado:** ✅ Hecho (2026-11-26) · robots, sitemap regenerable, JSON-LD y canonical; URLs `?playa=id`.
**Qué:** sitemap, `robots.txt`, JSON-LD (`TouristAttraction`/`Beach`), metadatos por playa y URLs legibles.
**Hecho cuando:**
- Cada playa tiene URL propia indexable con título y descripción únicos.
- Rich results válidos en el validador de Google.

### CC-54 · Caso de estudio y ADRs · P1 · M
**Estado:** ✅ Hecho (2026-11-26) · `docs/caso-de-estudio.md`, 4 ADRs y capturas 1440/390.
**Qué:** documento de portfolio con problema, decisiones (OpenLayers vs MapLibre, seed vs backend, URL como estado), trade-offs, métricas y capturas; ADRs cortos en `docs/adr/`.
**Hecho cuando:**
- El caso se puede leer sin clonar el repo y enlaza a la demo.
- Las métricas son reales y fechadas (bundle, tests, Lighthouse).

---

## Quick wins (todas S)

Si hay una tarde suelta, este es el orden de mayor impacto por hora:

1. **CC-06** títulos por playa y 404 — mejora percepción de producto y SEO.
2. **CC-04** documentación al día — evita que el siguiente agente repita trabajo.
3. **CC-24** búsqueda con acentos — fricción real en nombres baleares.
4. **CC-26** compartir ficha — Web Share API son ~30 líneas.
5. **CC-15** procedencia visible — protege la regla de no confundir demo con oficial.
6. **CC-23** contadores en filtros — ayuda a decidir sin probar combinaciones.

## Fuera de alcance por ahora

- Backend propio, autenticación y cuentas de usuario (el `localStorage` cubre favoritos).
- Subida de fotos por usuarios y moderación.
- Predicción de calidad del agua con modelos: sin datos históricos suficientes sería inventar.
- App nativa: la PWA cubre el caso.
- Mapas 3D o animaciones costosas: no aportan a la decisión de “¿a qué playa voy?”.

## De backlog a issues

Cuando el repo tenga remoto en GitHub, cada ticket puede convertirse en issue con:

```powershell
gh issue create --title "CC-12 · Importador CSV/JSON con validación" --body "Ver BACKLOG.md#cc-12"
```

Sugerencia de labels: `epic:datos`, `epic:mapa`, `epic:producto`, `epic:calidad`, `epic:infra`, más `P0`/`P1`/`P2` y `S`/`M`/`L`. Los P0 del Sprint 1 pueden agruparse en un milestone `v0.2 · publicable`.
