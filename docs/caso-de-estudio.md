# Costa Clara — Caso de estudio

Observatorio de playas y calidad del agua de Baleares: un mapa estático para consultar ubicación, servicios y estado del agua, y para compartir esa vista con un enlace.

Se puede leer sin clonar el repositorio. La demo es <https://costa-clara-k23.pages.dev>. El código está en <https://github.com/JuampaMolina/costa-clara>.

Las métricas de este documento se midieron el **2026-11-26** sobre el commit `9005c31`. No hay puntuación de Lighthouse en el repositorio; no se inventa.

## Problema

Quien va a una playa de Baleares necesita saber, en un solo sitio, dónde está, qué servicios tiene y qué calidad de agua se le atribuye. Esa información existe en fuentes oficiales (NÁYADE, censo de zonas de baño, ADEAC, IDEIB), pero el formato, la frecuencia y la licencia de reutilización no están verificados. Publicar números oficiales sin cita sería inventarlos.

Costa Clara separa las dos cosas. Los nombres y las coordenadas del seed son reales. La calidad, los servicios, la bandera azul y las fechas siguen etiquetados como demostración hasta que un CSV validado, con fuente y licencia, sustituya al seed. La app no tiene backend: el dataset viaja dentro del build.

## Usuarios

No hay investigación de usuarios en el repo. Los usos que el producto ya cubre son estos:

- Quien consulta el mapa: filtra por texto, isla, calidad y bandera azul, abre la ficha y pide cómo llegar.
- Quien comparte una vista: la URL lleva la búsqueda, los filtros y la playa seleccionada. Quien la abre recupera la misma ficha.
- Quien guarda favoritas en este navegador: `localStorage`, sin cuenta. El conjunto de favoritas no viaja en el enlace compartido.
- Quien mantiene el proyecto: el handoff, el backlog y el importador describen cómo seguir sin repetir decisiones ni mezclar datos demo con oficiales.

La interfaz está en español. No hay catalán ni inglés (CC-52, abierto).

## Alcance

### Dentro, en `9005c31`

- Mapa OpenLayers con clustering, tres capas base, geolocalización, pantalla completa y leyenda colapsable.
- Lista, filtros y ficha (calidad, servicios, última muestra, histórico SVG, tendencia, coordenadas).
- Estado compartible en la query string. Favoritos solo en el navegador.
- Procedencia visible: badge de demostración u oficial, fuente y licencia.
- Importador CSV con validación, fixture y fallback al seed. Hoy `GENERATED_BEACHES` es `null`, así que la demo usa el seed.
- Página 404, título y Open Graph al abrir una playa.
- CI (unitarios, build, e2e) y deploy automático a Cloudflare Pages.

### Fuera, a propósito

El backlog lo deja fuera por ahora: backend, cuentas, subida de fotos, predicción de calidad, app nativa y mapas 3D. Tampoco hay analítica, PWA, comparador ni fuente oficial conectada.

## Decisiones y trade-offs

Cuatro decisiones ya están en el código. El detalle está en `docs/adr/`.

| Decisión | Qué se gana | Qué se paga |
| --- | --- | --- |
| [OpenLayers](./adr/0001-openlayers.md) | Clustering, proyección, capas y atribución sin clave de teselas. El stack queda fijo. | El chunk `main` pesa 604.52 kB. El mapa no se carga en diferido (CC-41). |
| [URL como estado](./adr/0002-url-como-estado.md) | Una vista se comparte y sobrevive a una recarga, sin sesión de servidor. | Hace falta el fallback SPA. Favoritas, capa base y ubicación no viajan en el enlace. `replaceUrl` no deja deshacer un filtro con Atrás. |
| [Seed e importador](./adr/0003-seed-e-importador.md) | La demo existe sin licencia verificada. Un CSV inválido no sustituye al seed. | La calidad visible no es oficial. Actualizar datos es un commit, no un cron (CC-13). |
| [Pages, Direct Upload](./adr/0004-cloudflare-pages-direct-upload.md) | Cada push a `main` publica el mismo build estático. El token no está en el repo. | No hay preview por PR. CI y Deploy corren en paralelo: un test rojo no cancela el deploy. |

El repo no contiene una comparativa previa con MapLibre. CC-54 pide dejar esa alternativa por escrito; el ADR 0001 registra lo implementado y la regla de no cambiar el stack, no un bake-off que no existe.

## Métricas

Medidas el 2026-11-26 en `9005c31` (`npm run build`, Angular 22). El build terminó en 3.0 s y no superó el presupuesto (aviso a 700 kB, error a 1.2 MB).

| Métrica | Valor | Dónde |
| --- | --- | --- |
| Playas del seed | 19 (8 Mallorca, 4 Menorca, 4 Ibiza, 3 Formentera) | `src/app/core/data/beaches.seed.ts` |
| Datos generados | `null` (la app sigue en demo) | `beaches.generated.ts` |
| Tests unitarios | 26 | 6 specs de Vitest; ver desglose |
| Tests e2e | 30 | 15 flujos × desktop y Pixel 7 |
| Tickets | 19/36 cerrados; los 7 P0, cerrados | [BACKLOG.md](../BACKLOG.md), 2026-11-26 |
| Bundle inicial (raw) | 634.75 kB | `main` 604.52 kB + `styles` 30.23 kB |
| Transfer estimado | 163.09 kB | 157.17 kB + 5.92 kB |

Desglose unitario: `app` 2, `favorites` 4, `beach-history` 4, `beach-filter` 6, `data-import` 7, `geo` 3.

[HANDOFF.md](../HANDOFF.md) cita ~610 kB y [docs/despliegue.md](./despliegue.md) ~596 kB. Son aproximaciones anteriores. La fila de este documento es la salida de `npm run build` en `9005c31`.

Límites que el código ya impone y que no son métricas de producto: coordenadas del importador dentro de lon 1–4.5 y lat 38.5–40.2; islas solo `mallorca`, `menorca`, `ibiza` y `formentera`; calidades `excelente`, `buena`, `suficiente`, `insuficiente` y `sin-datos`.

## Enlaces

- Demo: <https://costa-clara-k23.pages.dev>
- Repositorio: <https://github.com/JuampaMolina/costa-clara>
- [README](../README.md) · [HANDOFF](../HANDOFF.md) · [BACKLOG](../BACKLOG.md)
- [Fuentes y licencias](./datos.md) · [Despliegue](./despliegue.md) · [Esquema del CSV](../data/README.md)
- ADRs: [0001](./adr/0001-openlayers.md) · [0002](./adr/0002-url-como-estado.md) · [0003](./adr/0003-seed-e-importador.md) · [0004](./adr/0004-cloudflare-pages-direct-upload.md)

## Siguientes pasos

Orden que ya marcan README y HANDOFF. Ninguno está hecho en `9005c31`.

1. Conectar la fuente oficial y automatizar la actualización (CC-13). Hasta entonces el seed sigue etiquetado como demo.
2. PWA offline (CC-40).
3. Comparador de playas, con la selección también en la URL (CC-21).
4. Auditoría axe del flujo principal (CC-50). La lista ya es alternativa textual al mapa (CC-34, cerrado); la auditoría no.
5. Storybook de los componentes de UI (CC-51).

CC-41 (rendimiento y carga diferida del mapa) es el sitio natural para bajar los 604.52 kB de `main` sin cambiar de librería.
