# ADR 0001 — OpenLayers como mapa

- **Estado:** aceptada (ya implementada)
- **Fecha:** 2026-11-26
- **Commit de referencia:** `9005c31`

## Contexto

Costa Clara es un mapa de playas de Baleares, no un listado con un mapa decorativo. Hace falta proyectar coordenadas, agrupar marcadores, cambiar de capa base con atribución, pintar la calidad y marcar la posición del usuario. La app es estática: no hay servidor de teselas propio ni clave de un proveedor de mapas en el cliente.

El stack fijado en [HANDOFF.md](../../HANDOFF.md) y [BACKLOG.md](../../BACKLOG.md) es Angular, OpenLayers y Tailwind. La regla de proyecto prohíbe cambiarlo. La dependencia es `ol` `^10.11.0`. El mapa vive en `src/app/features/beaches/beach-map.ts`.

CC-54 nombra MapLibre como alternativa a documentar. El repositorio no contiene una evaluación de MapLibre, Leaflet o Mapbox: no hay dependencia, nota de diseño ni prueba comparativa. Este ADR no inventa ese bake-off.

## Decisión

Usar OpenLayers 10, importando solo los módulos que el mapa necesita (`Map`, `View`, `Cluster`, `VectorLayer`, `OSM`, `XYZ`, estilos).

Lo que el código hace con esa librería:

- Capa vectorial agrupada (`Cluster`, distancia 42) con el color de `QUALITY_COLORS` y un halo en la playa seleccionada.
- Tres capas base intercambiables sin perder centro ni selección: OSM, OpenTopoMap (CC-BY-SA) y Esri World Imagery. La elección se guarda en `localStorage` (`costa-clara:basemap:v1`), no en la URL.
- Marcador de geolocalización en una capa aparte. La posición no se envía a ningún servidor (CC-30).
- Controles por defecto más escala. La atribución de las teselas permanece visible, como pide [docs/datos.md](../datos.md).
- La lista de resultados es la alternativa de teclado. El mapa es una región con nombre, no la única vía a los datos (CC-34).

No se añade MapLibre ni otra librería de mapas. Cambiarla exigiría revisar la regla de stack, no solo el componente.

## Consecuencias

- No hace falta una clave para la capa OSM. Las otras dos capas dependen de terceros (OpenTopoMap y Esri) y hay que mantener su atribución. Si un proveedor cambia la URL de teselas, el mapa se rompe sin un backend que lo absorba.
- El peso se nota. En `9005c31`, `npm run build` dejó el chunk `main` en 604.52 kB (157.17 kB transferidos) dentro de un inicial de 634.75 kB. Cabe bajo el aviso de 700 kB, pero OpenLayers es la mayor parte de ese chunk y el mapa no se carga en diferido. Bajarlo es CC-41, no un cambio de librería.
- Clustering, proyección (`fromLonLat`) y controles salen de la librería. No hay que mantener un motor de teselas propio para 19 puntos.
- La gráfica del histórico no usa OpenLayers ni otra dependencia: es un SVG propio (CC-20), para no sumar peso al de la ficha.
- Quien retome el mapa tiene que respetar `prefers-reduced-motion` en los `animate` de la vista y no ocultar la atribución al restilar los controles.
