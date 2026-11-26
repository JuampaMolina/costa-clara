# Especificación de producto y diseño — Filtros, ordenación, búsqueda y comparador

> **Ámbito:** CC-23 (ordenación y facetas), CC-24 (búsqueda robusta), CC-25 (filtros avanzados) y CC-21 (comparador de playas).
> **Base analizada:** `beaches-page.html/.ts`, `beach-detail.ts`, `beach-filter.ts`, `beach.ts`, `beaches.seed.ts`, `data-import.ts`, `styles.css` y `e2e/beaches.spec.ts` (v0.2 · 19 playas demo).
> **Reglas de proyecto:** UI en español, sin inventar datos oficiales ni añadir backend, respetando Angular 22 (standalone + signals + control flow) y Tailwind CSS 4.

---

## 1. Auditoría breve de UX/UI actual

1. **Barra de filtros — redundancia y presión vertical (`beaches-page.html:43-173`)**: el bloque superior incluye un icono decorativo de lupa (`h-9 w-9 bg-sea-50`) duplicado respecto al icono del propio `<input type="search">`; en desktop (`lg:h-[calc(100dvh-4rem)]`), sumar ordenación y filtros avanzados sin compactar esta cabecera dejaría poco espacio útil a la lista en pantallas de 720–800 px.
2. **Búsqueda sin debounce ni limpieza consistente (`beaches-page.ts:167-189,213-215`, `beach-filter.ts:18-34`)**: cada pulsación dispara `router.navigate(..., { replaceUrl: true })`, el `<input type="search">` depende de la cruz nativa del navegador (sin botón propio accesible), la isla no forma parte del *haystack* y `haystack.includes(query)` no tolera equivalentes baleares (`playa`/`platja`/`cala`) ni apóstrofos (`d'Hort` vs `dhort`).
3. **Filtros sin contadores previos (`beaches-page.html:84-122`)**: ni las píldoras de isla ni el `<select>` de calidad anticipan cuántas playas cumplen cada opción; el usuario descubre combinaciones vacías (p. ej. `insuficiente`, 0 playas en demo) por ensayo y error.
4. **Conflicto entre geolocalización y ordenación (`beaches-page.ts:116-119`)**: con `userLocation()` activo, la lista fuerza siempre el orden por distancia sin selector visible ni forma de ordenar por calidad o nombre conservando el dato `a X km`.
5. **Lista — calidad solo por color y acciones frágiles (`beaches-page.html:208-272`)**: cada fila comunica la calidad solo con un punto de `8×8 px` (`aria-hidden="true"`) y coloca el botón de favorito con `position: absolute` (~`28×28 px`), un patrón que se rompería al añadir el botón de comparar por solapamiento y área táctil insuficiente.
6. **Accesibilidad sin explotar en UI ni en seed (`beach.ts:13,38`, `beaches.seed.ts`, `beach-detail.ts`)**: el modelo tipa `accessibility?: 'adaptada' | 'parcial' | 'sin-datos'` y `data-import.ts:120-122` lo deriva de `'Acceso adaptado'`, pero las 19 playas demo no rellenan el campo y la ficha no lo destaca aparte de los chips planos de servicios.
7. **Ficha lateral sin entrada al comparador (`beach-detail.ts:40-94`)**: la barra de acciones superior resuelve bien favorito, compartir y cerrar, pero carece de acción «Comparar» para quien descubre playas desde el mapa; además queda pendiente gestionar foco al abrir/cerrar (alcance de CC-50).
8. **Solapamiento en la esquina superior derecha del mapa (`styles.css:32-36`, `beaches-page.html:315-353`)**: `.ol-zoom` y el botón de pantalla completa comparten `top: 0.75rem; right: 0.75rem`, por lo que conviene no añadir nuevos controles flotantes en esa zona (la bandeja del comparador debe ir anclada abajo).
9. **Móvil (`< 1024 px`) — columna larga antes del mapa (`beaches-page.html:40,206,306`)**: apilar filtros + lista (`max-h-[46dvh]`) + mapa (`min-h-[62dvh]`) ya exige scroll; por ello, los filtros avanzados deben nacer colapsados y el comparador debe abrirse en modal sobre el viewport con tarjetas apiladas, nunca incrustado en el `<aside>`.

---

## 2. Contrato compartido de URL y flujo de datos

Para que los cuatro tickets convivan sin colisiones en `BeachesPage`:

| Parámetro URL | Ticket | Valores válidos | Por defecto (se omite) | En `shareUrl` | ¿Lo limpia «Limpiar filtros»? |
| --- | --- | --- | --- | --- | --- |
| `q` | Existente / CC-24 | Texto libre `trim()` | `''` | Sí | Sí |
| `isla` | Existente / CC-23 | `mallorca \| menorca \| ibiza \| formentera` | `todas` | Sí | Sí |
| `calidad` | Existente / CC-23 | `excelente \| buena \| suficiente \| insuficiente \| sin-datos` | `todas` | Sí | Sí |
| `bandera` | Existente | `1` | `false` | Sí | Sí |
| `favoritas` | Existente | `1` | `false` | No (local) | Sí |
| `servicios` | **CC-25** | Slugs ordenados separados por coma (`aparcamiento,socorrista`) | `[]` | Sí | Sí |
| `accesibilidad` | **CC-25** | `adaptada \| parcial` | `todas` | Sí | Sí |
| `orden` | **CC-23** | `nombre \| calidad \| isla \| muestra \| distancia` | `nombre` | Sí, salvo `distancia` | No |
| `playa` | Existente | `Beach.id` válido | `null` | Sí | No |
| `comparar` | **CC-21** | Hasta 3 `Beach.id` válidos únicos (`id1,id2,id3`) | `[]` | Sí | No |

**Orden del pipeline en `BeachesPage`:**

1. Filtrado puro (`filterBeaches`) usando `query()` (con debounce en CC-24), `island()`, `quality()`, `blueFlag()`, `selectedServices()` y `accessibility()`.
2. Filtro local de favoritas (`showFavoritesOnly()`).
3. Ordenación pura (`sortBeaches`) según `sortBy()` y `userLocation()`.
4. Facetas con **conteo disyuntivo (*cross-filtering*)**: cada grupo de filtros cuenta sobre el conjunto resultante de aplicar **todos los demás filtros activos**, ignorando su propia dimensión.

---

## 3. Spec CC-23 — Ordenación y facetas

### Objetivo
Permitir ordenar los resultados por criterio útil (`nombre`, `calidad`, `muestra`, `isla` y `distancia` si hay ubicación) reflejándolo en la URL, y mostrar contadores dinámicos en los filtros de isla y calidad para anticipar resultados sin combinaciones vacías.

### Componentes y diseño

1. **Selector de ordenación en la cabecera de Resultados (`beaches-page.html`)**
   - Sustituye la cabecera de `Resultados` (actualmente etiqueta estática + pill `Favoritas`) por una barra compacta en una sola línea (`flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5`):
     - Izquierda: `<label for="sort-filter" class="sr-only">Ordenar resultados</label>` + `<select id="sort-filter" data-testid="sort-filter">` compacto (`rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 outline-none transition focus:border-sea-400 focus:ring-2 focus:ring-sea-100`).
     - Derecha: pill existente `Favoritas (N)`.
   - Criterios de ordenación (`BeachSort`):
     - `nombre` (defecto): `a.name.localeCompare(b.name, 'es')`.
     - `calidad`: descendente por `QUALITY_RANK[quality]` (`excelente` → `buena` → `suficiente` → `insuficiente` → `sin-datos`); desempate por `name` (`es`).
     - `muestra`: descendente por `lastSample` (`YYYY-MM-DD`, más reciente primero; vacíos al final); desempate por `name` (`es`).
     - `isla`: alfabético por etiqueta legible de `ISLANDS` (`Formentera`, `Ibiza`, `Mallorca`, `Menorca`); desempate por `name` (`es`).
     - `distancia`: ascendente por `distanceKm(userLocation, beach)`; solo aparece como `<option>` cuando `userLocation() !== null`.
   - Integración con **CC-30 («Cerca de mí»)**:
     - Al resolverse `requestLocation()`, `sortBy` pasa automáticamente a `'distancia'`.
     - Si el usuario cambia después `sortBy` a `'calidad'` o `'nombre'`, se respeta el orden elegido y las filas siguen mostrando `a X km`.
     - El aviso bajo la barra de filtros (`Ordenado por distancia a tu ubicación.`) solo se muestra cuando `locationStatus() === 'ready' && sortBy() === 'distancia'`.

2. **Contadores de facetas en islas y calidad**
   - **Píldoras de isla** (`Todas`, `Mallorca`, `Menorca`, `Ibiza`, `Formentera`):
     - Estructura del botón: `{{ option.label }} <span class="ml-1 text-[11px] opacity-75 tabular-nums">{{ islandCounts()[option.id] }}</span>`.
     - Cálculo: aplicar `query`, `quality`, `blueFlag`, `services`, `accessibility` y `showFavoritesOnly`, **ignorando `island`**. `Todas` muestra la suma total de ese conjunto.
     - Nota de pruebas existentes: `e2e/beaches.spec.ts` (L31 y L69) busca `getByRole('button', { name: 'Menorca', exact: true })`. Como el texto visible incluye el número (`Menorca 4`), el nombre accesible debe incluir el contador (WCAG 2.5.3 *Label in Name*) y actualizarse esos dos localizadores a `/^Menorca/` y `/^Formentera/` (además de añadir `data-testid="island-{{ option.id }}"`).
   - **Selector de calidad (`#quality-filter`)**:
     - Cada `<option>` muestra `{{ option.label }} ({{ qualityCounts()[option.id] }})`, p. ej. `Todas (19)`, `Excelente (10)`, `Insuficiente (0)`.
     - Cálculo: aplicar `query`, `island`, `blueFlag`, `services`, `accessibility` y `showFavoritesOnly`, **ignorando `quality`**.

3. **Sincronización URL (`orden`)**
   - Leer `orden` al iniciar; aceptar `'nombre' | 'calidad' | 'isla' | 'muestra'`.
   - Si viene `orden=distancia` sin ubicación o un valor desconocido, aplicar `'nombre'` y limpiar `orden` en URL.
   - Omitir `orden` de la URL cuando valga `'nombre'`.
   - En `shareUrl()`: incluir `orden` solo si no es `'nombre'` ni `'distancia'`.

### Estados

| Estado | Comportamiento visual y funcional |
| --- | --- |
| Por defecto (`orden=nombre`, sin filtros) | Select en `Orden: Nombre (A–Z)`, URL sin `orden`, contadores reflejan el total (`Todas 19`, `Mallorca 8`, `Menorca 4`, `Ibiza 4`, `Formentera 3`). |
| Con filtros activos | Contadores recalculan en tiempo real; islas con `0` inactivas muestran estilo atenuado (`opacity-60`) pero siguen siendo clicables. |
| Opción con `0` seleccionada | Muestra estado vacío estándar con botón «Limpiar filtros»; el contador sigue visible en la píldora activa (`0`). |
| Geolocalización activa | Se añade la opción `Más cercanas` y se selecciona automáticamente al obtener ubicación; cambiar a otro orden mantiene el badge `a X km` en la lista. |
| URL con `orden` inválido o `distancia` | Fallback silencioso a `nombre` sin error en consola ni pantalla en blanco. |

### Copy en español
- Label accesible del selector: `Ordenar resultados`
- Opciones del `<select>`:
  - `Orden: Nombre (A–Z)`
  - `Orden: Mejor calidad`
  - `Orden: Muestra más reciente`
  - `Orden: Isla (A–Z)`
  - `Orden: Más cercanas`
- Estado de ubicación cuando `sortBy() === 'distancia'`: `Ordenado por distancia a tu ubicación.`
- Estado de ubicación cuando `locationStatus() === 'ready'` y `sortBy() !== 'distancia'`: `Ubicación activa. Puedes elegir «Más cercanas» en el orden.`

### Criterios de aceptación
- [ ] Cambiar el selector de orden reordena la lista al instante y actualiza `?orden=` en la URL (omitiéndolo para `nombre`).
- [ ] Recargar la página con `?orden=calidad` o `?orden=muestra` restaura el orden seleccionado en el `<select>` y en la lista.
- [ ] Los contadores de isla reflejan todos los filtros activos excepto `isla`; los de calidad reflejan todos excepto `calidad`.
- [ ] Activar «Cerca de mí» selecciona `Más cercanas`; elegir otro orden después reordena la lista sin perder la distancia en cada fila.
- [ ] `orden` inválido o `orden=distancia` sin permiso vuelve a `nombre` sin errores.
- [ ] Tests unitarios cubren `sortBeaches`, `countByIsland` y `countByQuality`; e2e cubre cambio de orden, recarga con URL y actualización de contadores.

### Archivos para Forge
- **Tocar:**
  - `src/app/core/utils/beach-filter.ts` (`BeachSort`, `sortBeaches`, `countByIsland`, `countByQuality`)
  - `src/app/core/utils/beach-filter.spec.ts`
  - `src/app/features/beaches/beaches-page.ts`
  - `src/app/features/beaches/beaches-page.html`
  - `e2e/beaches.spec.ts` (actualizar L31 y L69 por el contador en la píldora + añadir casos de orden/facetas)
- **No tocar:** `beach-map.ts`, `beach-detail.ts`, `beach-history.ts`, `favorites.ts`, `beaches.seed.ts`, `data-import.ts`.

---

## 4. Spec CC-24 — Búsqueda robusta

### Objetivo
Hacer que la búsqueda sea tolerante a mayúsculas, acentos, apóstrofos, sinónimos baleares (`playa`/`platja`/`cala`) y consultas multipalabra, aplicando debounce para no disparar navegaciones de URL en cada tecla y ofreciendo limpieza inmediata.

### Componentes y diseño

1. **Campo de búsqueda mejorado (`beaches-page.html`)**
   - Retirar el icono decorativo de lupa de la cabecera de la tarjeta (`beaches-page.html:51-59`) para reducir ruido visual y ganar altura útil.
   - Mantener `<input type="search">` con `pr-9` y `[&::-webkit-search-cancel-button]:appearance-none` para ocultar la cruz nativa inconsistente y usar un único botón de limpieza propio.
   - Botón interno de borrado (`absolute right-2 top-1/2 -translate-y-1/2`):
     - Visible solo cuando `queryInput().length > 0`.
     - Tamaño táctil `h-7 w-7` centrado, `rounded-full text-slate-400 hover:bg-slate-200/70 hover:text-slate-700`.
     - `type="button"`, `aria-label="Limpiar búsqueda"`, `data-testid="clear-search"`.
     - Al pulsar: limpia `queryInput` y `query` en **0 ms**, cancela el timer de debounce y devuelve el foco al `<input>` (`searchInput()?.nativeElement.focus()`).
   - Teclado en el `<input>`:
     - `Escape` con texto: limpia inmediatamente (mismo efecto que `clear-search`).
     - `Enter`: aplica el texto pendiente de inmediato (cancela el debounce y sincroniza).

2. **Debounce controlado (`beaches-page.ts`)**
   - Separar dos signals:
     - `queryInput = signal(initialQuery)` enlazada al `[value]` del `<input>` (escritura fluida a 0 ms).
     - `query = signal(initialQuery)` que alimenta `filteredBeaches`, facetas y `effect()` de sincronización de URL.
   - Al escribir (`onQueryInput(value)`):
     - Actualiza `queryInput.set(value)`.
     - Cancela el `setTimeout` anterior.
     - Si `value.trim() === ''`, actualiza `query.set('')` al instante (0 ms).
     - En caso contrario, programa `query.set(value)` tras **250 ms** (limpiando el timeout en `DestroyRef.onDestroy`).
   - Al ejecutar `clearFilters()`: cancela el timeout y pone tanto `queryInput` como `query` a `''` en 0 ms.

3. **Normalización, sinónimos y tokenización (`beach-filter.ts`)**
   - `normalizeText(value)`:
     1. `NFD` y eliminación de diacríticos (`[\u0300-\u036f]`).
     2. Minúsculas.
     3. Sustituir puntuación y separadores (`['’\`·\-_/.,;:()]+`) por espacio y colapsar espacios múltiples.
   - **Soporte de apóstrofos catalanes**: construir el *haystack* de cada playa con `name`, `municipality`, etiqueta de `island` (`ISLANDS`), `description` y `services`, añadiendo además la variante compacta sin apóstrofos del nombre (`"Cala d'Hort"` → `"cala d hort"` y `"cala dhort"`; `"Platja d'en Bossa"` → `"platja d en bossa"` y `"platja den bossa"`).
   - **Grupos de sinónimos bidireccionales** (`SEARCH_SYNONYM_GROUPS`):
     - `['playa', 'playas', 'platja', 'platges', 'cala', 'cales']`
     - `['aparcamiento', 'parking']`
     - `['aseos', 'bano', 'banos', 'wc']`
     - `['socorrista', 'salvamento']`
     - `['adaptado', 'adaptada', 'accesible', 'pmr']`
   - **Coincidencia multipalabra (AND por token)**:
     - Dividir la consulta normalizada en tokens (ignorando artículos/preposiciones de 1–2 letras como `de`, `la`, `el`, `d`, `en` solo cuando hay más de un token; nunca ignorar `es`, `sa`, `ses` para no romper `Es Trenc`, `Sa Calobra`, `Ses Illetes`).
     - Cada token debe aparecer en el *haystack* ya sea de forma directa o mediante cualquiera de los términos de su grupo de sinónimos.
     - Ejemplos garantizados:
       - `formentera`, `Formentera`, `fòrmentera` → mismo resultado (las 3 playas de Formentera).
       - `playa de palma` / `platja palma` → `Platja de Palma`.
       - `playa mondrago` → `Cala Mondragó`.
       - `cala dhort` / `cala d'hort` → `Cala d'Hort`.
       - `parking mallorca` → playas de Mallorca con `Aparcamiento` (`Es Trenc`, `Platja de Palma`).

### Estados

| Estado | Comportamiento visual y funcional |
| --- | --- |
| Vacío (`queryInput === ''`) | Placeholder visible, sin botón `×`, sin `?q=` en URL. |
| Escribiendo (ventana ≤ 250 ms) | Input refleja el texto sin retraso; botón `×` visible; la URL espera a que cese el tecleo. |
| Activo (`query` aplicado) | Lista, mapa y contadores filtrados; `?q=<trim>` sincronizado en URL; `hasFilters() === true`. |
| Sin resultados | Estado vacío contextualizado con el término buscado y acciones directas de limpieza. |
| Limpieza rápida (`×` o `Escape`) | Vuelve al estado vacío en 0 ms y mantiene el foco en el buscador. |

### Copy en español
- Placeholder del buscador: `Buscar playa, cala, municipio o servicio`
- `aria-label` del input: `Buscar playa` (conservado para no romper tests existentes)
- `aria-label` botón limpiar: `Limpiar búsqueda`
- Estado vacío cuando hay texto buscado (`query().trim().length > 0`):
  - Título: `No hay playas para «{{ query().trim() }}»`
  - Subtexto: `Prueba con otro nombre, municipio o quita algún filtro.`
  - Botón secundario (si además hay otros filtros activos): `Limpiar búsqueda`
  - Botón primario: `Limpiar filtros`

### Criterios de aceptación
- [ ] `formentera`, `Formentera` y `fòrmentera` devuelven exactamente las mismas playas.
- [ ] `playa de palma` encuentra `Platja de Palma`; `playa mondrago` encuentra `Cala Mondragó`; `cala dhort` encuentra `Cala d'Hort`.
- [ ] Buscar por nombre de isla (`mallorca`, `menorca`, `ibiza`, `formentera`) devuelve todas las playas de esa isla.
- [ ] Escribir rápido (`pressSequentially` de 8+ caracteres en < 200 ms) dispara una única actualización de URL al finalizar el debounce (250 ms), nunca una por tecla.
- [ ] El botón «Limpiar búsqueda» y la tecla `Escape` vacían el campo al instante, borran `q` de la URL y devuelven el foco al buscador.

### Archivos para Forge
- **Tocar:**
  - `src/app/core/utils/beach-filter.ts` (`normalizeText`, sinónimos, tokenización, `island` en haystack)
  - `src/app/core/utils/beach-filter.spec.ts`
  - `src/app/features/beaches/beaches-page.ts` (`queryInput`, debounce 250 ms, `clearSearch`, `flushSearch`)
  - `src/app/features/beaches/beaches-page.html` (quitar lupa decorativa, añadir botón limpiar, estado vacío con texto buscado)
  - `e2e/beaches.spec.ts`
- **No tocar:** `beach-map.ts`, `beach-detail.ts`, `beach-history.ts`, `favorites.ts`, `beaches.seed.ts`, `data-import.ts`.

---

## 5. Spec CC-25 — Filtros avanzados

### Objetivo
Permitir filtrar por servicios disponibles (derivados dinámicamente del dataset) y nivel de accesibilidad mediante un panel colapsable que se combina con el resto de filtros, se sincroniza con la URL y se limpia en una sola acción.

### Decisión de alcance sobre «tipo de playa»
El backlog cita servicios, accesibilidad y tipo de playa. El modelo actual (`src/app/core/models/beach.ts`) y el importador (`data-import.ts`) ya soportan `services: ServiceId[]` y `accessibility?: 'adaptada' | 'parcial' | 'sin-datos'`, pero **no existe ningún campo `beachType`**. Para respetar la regla de **no inventar datos oficiales** ni inferirlos por texto libre de `description`, esta spec implementa **servicios derivados + accesibilidad** y deja el panel preparado para sumar un tercer bloque «Tipo de playa» en cuanto el dataset real aporte ese campo tipado.

### Derivación de opciones desde el dataset (`beach-filter.ts`)
- **Servicios (`getAvailableServices(beaches: Beach[]): ServiceId[]`)**:
  - Extrae los servicios únicos realmente presentes en `beaches` (sin hardcodear en el template).
  - Ordena siguiendo el orden canónico de `SERVICES` (y alfabético `es` para valores futuros).
  - En el seed actual devuelve los 6 servicios presentes (`Socorrista`, `Aseos`, `Duchas`, `Aparcamiento`, `Acceso adaptado`, `Chiringuito`).
- **Accesibilidad efectiva (`getBeachAccessibility(beach: Beach): Accessibility`)**:
  - Devuelve `beach.accessibility ?? (beach.services.includes('Acceso adaptado') ? 'adaptada' : 'sin-datos')`.
  - Replica exactamente la lógica de `data-import.ts:120-122` para asegurar consistencia total entre seed demo y datos importados.
- **Niveles de accesibilidad disponibles (`getAvailableAccessibilityLevels(beaches: Beach[])`)**:
  - Devuelve los valores positivos presentes en el dataset (`'adaptada'`, `'parcial'`) precedidos por `'todas'`.
  - En el seed demo aparecen `Todas` y `Adaptada` (evitando mostrar una opción muerta `Parcial (0)`), y en cuanto un CSV real incluya `parcial` aparecerá automáticamente.

### Componentes y diseño

1. **Disparador colapsable («Más filtros»)**
   - Ubicación: fila de utilidades de la tarjeta de filtros (junto al contador de resultados, «Cerca de mí» y «Limpiar filtros»), o en una barra compacta justo debajo de `calidad + bandera azul` para mantener un ritmo visual claro:
     - Botón `type="button"`, `id="advanced-filters-toggle"`, `data-testid="advanced-filters-toggle"`, `[attr.aria-expanded]="advancedOpen()"`, `aria-controls="advanced-filters-panel"`.
     - Contenido: icono de filtros (`sliders`, `h-3.5 w-3.5`) + `Más filtros` + badge contador solo si `activeAdvancedCount() > 0` (`rounded-full bg-sea-600 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums`) + chevron que rota `180°`.
   - Estado inicial: **colapsado** (`false`), salvo cuando la URL inicial ya contiene `servicios` o `accesibilidad` válidos, en cuyo caso arranca **abierto** (`true`) para hacer visibles los filtros aplicados.

2. **Panel colapsable (`#advanced-filters-panel`)**
   - Contenedor: `mt-3 space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/75 p-3`.
   - **Bloque A — Servicios**:
     - Etiqueta: `Servicios` (`text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500`) + pista breve `Deben cumplirse todos` (`text-[11px] text-slate-400`).
     - `role="group" aria-label="Filtrar por servicios"`.
     - Chips toggle (`aria-pressed`, `rounded-full px-2.5 py-1 text-xs font-medium transition`):
       - Activo: `bg-sea-700 text-white shadow-xs` (contraste AA > 5.9:1).
       - Inactivo: `border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100`.
     - Semántica **AND**: seleccionar `Socorrista` + `Aparcamiento` muestra solo las playas que tienen ambos.
     - Cada chip muestra su contador contextual (`tabular-nums`): cuántas playas quedarían al aplicar ese servicio junto a los filtros actuales (si queda `0` y está inactivo, estilo `opacity-60`).
   - **Bloque B — Accesibilidad**:
     - Etiqueta: `Accesibilidad` (`text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500`).
     - `role="group" aria-label="Filtrar por accesibilidad"`.
     - Píldoras de selección única (`Todas`, `Adaptada`, y `Parcial` si existe en el dataset) con contador cross-filtered (ignorando `accesibilidad`).

3. **URL (`servicios` y `accesibilidad`)**
   - Mapeo determinista `ServiceId ↔ slug` (en `beach-filter.ts`, derivado con `slugifyService` o tabla tipada `Record<ServiceId, string>`):
     - `Socorrista` ↔ `socorrista`
     - `Aseos` ↔ `aseos`
     - `Duchas` ↔ `duchas`
     - `Aparcamiento` ↔ `aparcamiento`
     - `Acceso adaptado` ↔ `acceso-adaptado`
     - `Chiringuito` ↔ `chiringuito`
   - `servicios`: lista ordenada alfabéticamente separada por comas (`?servicios=aparcamiento,socorrista`); se omite si está vacía.
   - `accesibilidad`: `adaptada` o `parcial`; se omite si es `todas`.
   - Entradas desconocidas o duplicadas en URL se descartan sin error y la URL se normaliza.
   - Ambos parámetros se incluyen en `shareUrl()`.

4. **Limpiar filtros y estado vacío**
   - `hasFilters()` devuelve `true` si `selectedServices().length > 0 || accessibility() !== 'todas'` (además de los filtros existentes).
   - `clearFilters()` restablece de una sola vez `queryInput`, `query`, `island`, `quality`, `blueFlag`, `showFavoritesOnly`, `selectedServices` (`[]`) y `accessibility` (`'todas'`).
   - En estado vacío con filtros avanzados activos, el copy orienta al usuario y el CTA «Limpiar filtros» restaura toda la vista.

### Estados

| Estado | Comportamiento visual y funcional |
| --- | --- |
| Colapsado sin filtros avanzados | Solo botón «Más filtros» con chevron hacia abajo; altura de la tarjeta intacta. |
| Colapsado con filtros activos | Botón «Más filtros» muestra badge azul con el número de filtros activos (ej. `2`); botón global «Limpiar filtros» visible. |
| Expandido | Muestra bloques de Servicios y Accesibilidad con contadores dinámicos; en móvil no oculta el botón de colapsar. |
| Restaurado desde URL | Si la URL trae `servicios` o `accesibilidad`, aplica los filtros y abre el panel inicialmente. |
| Vacío (0 playas) | Muestra «No hay playas con esos filtros», explicación breve y botón «Limpiar filtros». |
| URL con valores inválidos | Ignora slugs o niveles inexistentes y limpia los query params. |

### Copy en español
- Botón panel: `Más filtros`
- Cabecera servicios: `Servicios` · ayuda: `Coinciden todos`
- Cabecera accesibilidad: `Accesibilidad`
- Opciones accesibilidad: `Todas`, `Adaptada`, `Parcial`
- Estado vacío cuando hay filtros avanzados activos:
  - Título: `No hay playas con esos filtros`
  - Subtexto: `Prueba a quitar algún servicio o cambiar de isla.`
  - Botón: `Limpiar filtros`

### Criterios de aceptación
- [ ] Ningún nombre de servicio está hardcodeado en `beaches-page.html`; las opciones nacen de `getAvailableServices(BEACHES)`.
- [ ] Seleccionar varios servicios aplica lógica AND y se combina con búsqueda, isla, calidad, bandera azul y favoritas.
- [ ] Filtrar por `Adaptada` devuelve las 5 playas con `Acceso adaptado` en el seed demo y usa `beach.accessibility` cuando esté informado.
- [ ] `?servicios=aparcamiento,socorrista&accesibilidad=adaptada` restaura los filtros al recargar y abre el panel.
- [ ] «Limpiar filtros» limpia en un clic tanto los filtros básicos como los avanzados y borra `servicios` y `accesibilidad` de la URL.
- [ ] El panel es accesible por teclado (`aria-expanded`, `aria-controls`, `aria-pressed`) y no genera scroll horizontal en 360–390 px.

### Archivos para Forge
- **Tocar:**
  - `src/app/core/utils/beach-filter.ts` (`getAvailableServices`, `getBeachAccessibility`, `getAvailableAccessibilityLevels`, slugs `servicesToParam`/`parseServicesParam`, ampliar `BeachFilters` y `filterBeaches`)
  - `src/app/core/utils/beach-filter.spec.ts`
  - `src/app/features/beaches/beaches-page.ts`
  - `src/app/features/beaches/beaches-page.html`
  - `e2e/beaches.spec.ts`
- **No tocar:** `beach-map.ts`, `beach-history.ts`, `favorites.ts`, `beaches.seed.ts`, `data-import.ts`, `src/app/core/models/beach.ts` (salvo exportar `ACCESSIBILITY_LABELS` si ayuda a reutilizar en CC-21).

---

## 6. Spec CC-21 — Comparador de playas

### Objetivo
Permitir seleccionar entre 2 y 3 playas para comparar en paralelo su calidad del agua, tendencia, bandera azul, municipio/isla, accesibilidad, servicios y última muestra, con URL compartible (`?comparar=id1,id2`), vista en tabla para desktop y tarjetas apiladas para móvil.

### Componentes y diseño

1. **Entrada 1 — Fila de la lista de resultados (`beaches-page.html`)**
   - Refactorizar la fila del resultado de `position: absolute` a un contenedor `flex items-center gap-1`:
     - Izquierda (`flex-1 min-w-0`): botón de selección de playa existente (`selectBeach(beach)`), añadiendo además texto discreto de calidad o `sr-only` para no depender solo del punto de color (mejora de accesibilidad sin engordar la fila).
     - Derecha (`flex shrink-0 items-center gap-0.5 pr-1.5`):
       1. Botón **Comparar** (`h-8 w-8 grid place-items-center rounded-full`, icono de dos columnas/balanza `16×16`, `aria-pressed`, `data-testid="compare-{{ beach.id }}"`):
          - Activo: `bg-sea-50 text-sea-700 ring-1 ring-sea-200`.
          - Inactivo (0–2 seleccionadas): `text-slate-400 hover:bg-slate-100 hover:text-slate-700`.
          - Inactivo con cupo lleno (3/3): `text-slate-300 opacity-60 hover:bg-slate-100` (sigue clicable para explicar el límite).
       2. Botón **Favorita** (`h-8 w-8 grid place-items-center rounded-full`, conservando `data-testid="favorite-{{ beach.id }}"`).

2. **Entrada 2 — Ficha de playa (`beach-detail.ts`)**
   - Añadir un botón «Comparar» en la barra superior de acciones (a la izquierda del corazón de favorita), controlado por `isCompared = input(false)` y `compareToggled = output<void>()`:
     - `data-testid="detail-compare"`, `[attr.aria-pressed]="isCompared()"`, `[attr.aria-label]="isCompared() ? 'Quitar del comparador' : 'Añadir al comparador'"`.
     - Activo: `bg-sea-50 text-sea-700 ring-1 ring-sea-200`. Inactivo: `text-slate-400 hover:bg-slate-100 hover:text-slate-700`.

3. **Bandeja flotante de comparación (Compare Tray, en `beaches-page.html`)**
   - Visible solo cuando `comparedBeaches().length > 0` y el modal está cerrado.
   - Posición:
     - Desktop (`sm:`): `fixed bottom-4 left-1/2 z-40 w-[min(92vw,680px)] -translate-x-1/2 rounded-2xl border border-slate-700/70 bg-slate-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur`.
     - Móvil (`< 640 px`): `fixed inset-x-3 bottom-3 z-40 rounded-2xl ...` (con `pb-[max(0.75rem,env(safe-area-inset-bottom))]`).
   - Contenido:
     - Cabecera/izquierda: contador `Comparar ({{ comparedBeaches().length }}/3)` + chips compactos de las playas seleccionadas (nombre truncado + botón `×` `aria-label="Quitar {{ beach.name }} del comparador"`). En `< 640 px`, los chips van en una fila con `flex-wrap gap-1.5` y tamaño compacto `text-[11px]`.
     - Derecha:
       - Botón **«Vaciar»** (`text-xs text-slate-300 hover:text-white`).
       - Botón primario **«Ver comparativa»** (`data-testid="open-compare"`):
         - Si `comparedBeaches().length < 2`: `disabled`, estilo atenuado (`bg-slate-700 text-slate-300 cursor-not-allowed`), texto visible `Elige 1 más` (o `Comparar (1/3)` con ayuda textual `Añade al menos 2 playas para comparar`).
         - Si `comparedBeaches().length >= 2`: activo (`bg-sea-500 text-white hover:bg-sea-400`), texto `Comparar ({{ comparedBeaches().length }})`.
   - **Aviso de exceso (intento de 4.ª playa)**:
     - Al pulsar «Comparar» en una playa no seleccionada cuando ya hay 3:
       - No modifica las 3 existentes.
       - Muestra un mensaje inline en la bandeja (`role="status" aria-live="polite"`, `text-xs font-medium text-amber-300`) durante 3,5 s: **«Máximo 3 playas a la vez. Quita una para añadir otra.»**

4. **Modal / Vista comparadora (`src/app/features/beaches/beach-compare.ts`)**
   - Componente standalone `app-beach-compare` con inputs `beaches = input.required<Beach[]>()`, `shareUrl = input('')`, `userLocation = input<Coordinates | null>(null)` y outputs `removed = output<string>()`, `cleared = output<void>()`, `selected = output<Beach>()`, `closed = output<void>()`.
   - Contenedor modal:
     - Backdrop: `fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-2 backdrop-blur-[2px] sm:items-center sm:p-4` (clic en backdrop cierra el diálogo).
     - Panel: `role="dialog" aria-modal="true" aria-labelledby="compare-title"`, `max-h-[88dvh] w-full max-w-4xl flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`.
   - Cabecera fija del modal:
     - Izquierda: `<h2 id="compare-title">Comparativa de playas</h2>` + subtítulo `{{ beaches().length }} de 3 playas`.
     - Derecha: botón **«Copiar enlace»** (`data-testid="compare-share"`, Web Share API / portapapeles idéntico a `beach-detail.ts` con confirmación `Enlace copiado`), botón **«Vaciar»** y botón **«Cerrar comparador»** (`×`).
   - **Desktop (`hidden md:block`, `>= 768 px`) — Tabla semántica**:
     - `<table>` con `<caption class="sr-only">Comparativa de playas seleccionadas</caption>`.
     - Columnas (`<th scope="col">`): primera columna fija de atributos (`w-40`), y 2 o 3 columnas iguales para las playas. Cada cabecera de playa muestra: nombre (botón para abrir su ficha en el mapa), `municipio · isla` y botón `Quitar`.
     - Filas (`<th scope="row">`):
       1. `Calidad del agua`: punto `QUALITY_COLORS` + etiqueta textual (`Excelente`, `Buena`, etc.).
       2. `Tendencia`: `↑ Mejora` / `↓ Empeora` / `→ Estable` / `Sin tendencia` (reutilizando `getBeachSamples` + `getSamplesTrend`).
       3. `Bandera azul`: `Sí` (pill `bg-sky-50 text-sky-700`, añadiendo `({{ beach.blueFlagYear }})` si existe) / `No` (`text-slate-500`).
       4. `Isla y municipio`: `{{ islandLabel }} · {{ beach.municipality }}`.
       5. `Distancia` *(solo si `userLocation() !== null`)*: `a {{ formatDistance(...) }}`.
       6. `Accesibilidad`: `Adaptada` / `Parcial` / `Sin datos` (vía `getBeachAccessibility`).
       7. `Servicios`: sub-filas para cada servicio presente en al menos una de las playas comparadas (o mensaje «Ninguna tiene servicios registrados» si todas están vacías), mostrando icono ✓ + `Sí` (`text-emerald-700 font-medium`) o `—` + `No` (`text-slate-400`).
       8. `Última muestra`: fecha `es-ES` (`14 sept 2026`).
       9. `Acciones`: botón `Ver en el mapa` (cierra comparador y selecciona esa playa) + enlace `Cómo llegar` (Google Maps).
   - **Móvil (`md:hidden`, `< 768 px`) — Tarjetas apiladas**:
     - Lista vertical (`space-y-3`) de `<article>` (una por playa, sin scroll horizontal):
       - Cabecera de tarjeta: nombre + `municipio · isla` + botón `Quitar`.
       - Rejilla `<dl class="grid grid-cols-2 gap-2.5 text-xs">`: Calidad, Tendencia, Bandera azul, Accesibilidad, Última muestra y (si existe) Distancia.
       - Bloque de servicios: chips con los servicios de la playa (o «Sin servicios registrados»).
       - Pie de tarjeta: `Ver en el mapa` + `Cómo llegar`.
   - **Comportamiento al quitar playas dentro del modal**:
     - Si había 3 y se quita 1 → el modal se actualiza a 2 columnas/tarjetas.
     - Si había 2 y se quita 1 → el modal se cierra automáticamente, queda la bandeja en `1/3` y se anuncia en `aria-live`: «Queda 1 playa en el comparador. Añade otra para comparar.»

5. **URL (`comparar`)**
   - Formato: `?comparar=es-trenc,cala-macarella` o `?comparar=es-trenc,cala-macarella,ses-illetes`.
   - Parsing (`parseCompareIds(raw, validIds)`): divide por coma, elimina vacíos, deduplica manteniendo orden, descarta IDs inexistentes en `BEACHES` y recorta a un máximo de **3**.
   - Apertura automática al cargar: si la URL entrante tiene **2 o 3** IDs válidos, `compareOpen` arranca en `true` para que un enlace compartido abra directamente la comparativa. Si solo tiene 1 ID válido, muestra la bandeja en `1/3` sin abrir el modal.
   - `shareUrl()` y el botón «Copiar enlace» del comparador incluyen `?comparar=...`.

6. **Accesibilidad del comparador (WCAG AA)**
   - `role="dialog"`, `aria-modal="true"`, `aria-labelledby="compare-title"`.
   - Al abrir el modal: mover el foco al botón «Cerrar comparador» (o al título con `tabindex="-1"`), capturar `Escape` para cerrar y atrapar `Tab`/`Shift+Tab` dentro del diálogo.
   - Al cerrar el modal: devolver el foco al botón que lo abrió (`open-compare`).
   - Región `aria-live="polite"` en `BeachesPage` para anunciar altas, bajas y límite máximo alcanzado.
   - Tabla con `<caption>`, `<th scope="col">` y `<th scope="row">`.
   - Contraste ≥ 4.5:1 en todo texto (bandeja oscura `#0f172a` con `#ffffff` y `#bae6fd`; modal blanco con `#0f172a` y `#334155`).

### Estados

| Estado | Comportamiento visual y funcional |
| --- | --- |
| Vacío (`0/3`) | Sin bandeja inferior; botones «Comparar» en reposo; sin `?comparar=` en URL. |
| Parcial (`1/3`) | Bandeja visible con 1 chip; botón principal deshabilitado con texto guía «Añade 1 playa más». |
| Listo (`2/3` o `3/3`) | Bandeja visible con chips; botón «Comparar (2)» / «Comparar (3)» activo; URL sincronizada. |
| Exceso (clic en 4.ª playa) | No añade ni sustituye; aviso `role="status"` «Máximo 3 playas a la vez. Quita una para añadir otra.» |
| Modal abierto desktop (`>= 768 px`) | Tabla semántica de 2–3 columnas con todos los atributos y matriz de servicios. |
| Modal abierto móvil (`< 768 px`) | Tarjetas apiladas verticalmente sin scroll horizontal. |
| URL con >3 IDs o IDs inválidos | Filtra válidos únicos, conserva los 3 primeros y limpia la URL; si quedan ≥ 2, abre el modal. |
| Enlace copiado | Confirmación `Enlace copiado` (o `No se pudo copiar el enlace`) con `role="status"`. |

### Copy en español
- Botón fila/ficha inactivo (`aria-label`): `Añadir {{ beach.name }} al comparador`
- Botón fila/ficha activo (`aria-label`): `Quitar {{ beach.name }} del comparador`
- Cabecera bandeja: `Comparar ({{ count }}/3)`
- Botón bandeja con 1 playa: `Añade 1 playa más`
- Botón bandeja con 2–3 playas: `Comparar ({{ count }})`
- Botón limpiar bandeja/modal: `Vaciar`
- Aviso de exceso: `Máximo 3 playas a la vez. Quita una para añadir otra.`
- Título del modal: `Comparativa de playas`
- Subtítulo del modal: `{{ count }} de 3 playas`
- Botones del modal: `Copiar enlace`, `Vaciar`, `Cerrar comparador`, `Ver en el mapa`, `Cómo llegar`, `Quitar`
- Confirmación de copiado: `Enlace copiado` / `No se pudo copiar el enlace`
- Etiquetas de filas: `Calidad del agua`, `Tendencia`, `Bandera azul`, `Isla y municipio`, `Distancia`, `Accesibilidad`, `Servicios`, `Última muestra`, `Acciones`
- Anuncio al bajar de 2 playas: `Queda 1 playa en el comparador. Añade otra para comparar.`

### Criterios de aceptación
- [ ] Se pueden añadir/quitar playas desde la lista y desde la ficha lateral; ambos controles permanecen sincronizados.
- [ ] Con 1 playa la bandeja explica que falta al menos otra; con 2 o 3 permite abrir la comparativa.
- [ ] Intentar añadir una 4.ª playa no modifica la selección y muestra el aviso de límite máximo con `role="status"`.
- [ ] En desktop (`>= 768 px`) se muestra una tabla semántica (`<th scope="col/row">`); en móvil (`< 768 px`) se muestran tarjetas apiladas sin desbordamiento horizontal.
- [ ] Abrir `/?comparar=es-trenc,cala-macarella` abre automáticamente la comparativa con esas 2 playas; recargar mantiene la selección.
- [ ] Abrir `/?comparar=es-trenc,cala-macarella,ses-illetes,son-bou,inexistente` conserva solo las 3 primeras válidas y limpia la URL.
- [ ] Teclado: `Escape` cierra el modal, `Tab` permanece dentro del diálogo y el foco vuelve al disparador al cerrar.

### Archivos para Forge
- **Tocar:**
  - `src/app/features/beaches/beach-compare.ts` *(nuevo componente standalone)*
  - `src/app/core/utils/beach-filter.ts` (o `src/app/core/utils/beach-compare.ts` para `parseCompareIds` + reutilizar `getBeachAccessibility`)
  - `src/app/features/beaches/beaches-page.ts`
  - `src/app/features/beaches/beaches-page.html`
  - `src/app/features/beaches/beach-detail.ts` (input `isCompared`, output `compareToggled`, botón compacto en barra de acciones)
  - `e2e/beaches.spec.ts` + tests unitarios de `parseCompareIds`
- **No tocar:** `beach-map.ts`, `beach-history.ts`, `favorites.ts`, `beaches.seed.ts`, `data-import.ts`, `not-found.ts`.

---

## 7. Secuencia recomendada para Forge

1. **CC-24 (búsqueda robusta)** — establece `normalizeText`, sinónimos, tokenización y `queryInput` con debounce de 250 ms sobre `beach-filter.ts` y `beaches-page.ts`.
2. **CC-23 (ordenación y facetas)** — añade `BeachSort`, `sortBeaches`, `countByIsland`, `countByQuality`, URL `orden` e integración limpia con «Cerca de mí» (actualizando L31 y L69 de `e2e/beaches.spec.ts`).
3. **CC-25 (filtros avanzados)** — añade `getAvailableServices`, `getBeachAccessibility`, `getAvailableAccessibilityLevels`, panel colapsable y URL `servicios`/`accesibilidad`.
4. **CC-21 (comparador)** — refactoriza la fila de lista a flex para los dos botones de acción, añade entrada en `beach-detail.ts`, bandeja inferior, modal `BeachCompare` y URL `comparar`.
5. **Validación final** — `npm test -- --watch=false`, `npm run build` (vigilando el presupuesto de 700 kB warning) y `npm run test:e2e` en desktop y móvil.
