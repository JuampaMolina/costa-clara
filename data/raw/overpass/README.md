# Overpass · OpenStreetMap (datos crudos de muestreo)

Respuestas JSON crudas de la [Overpass API](https://overpass-api.de/api/interpreter) para las
playas (`natural=beach`) de las Illes Balears, capturadas para el prototipo de viabilidad
(no se usan en la app todavía).

## Consulta

```text
[out:json][timeout:240];
(
  node["natural"="beach"](BBOX);
  way["natural"="beach"](BBOX);
  relation["natural"="beach"](BBOX);
);
out center tags;
```

con `BBOX = 38.4,1.0,40.3,4.6` (una sola consulta, sin solape entre cuadrantes):

| Isla (clasificación por centroide) | Elementos con nombre |
| --- | --- |
| Mallorca | 242 |
| Menorca | 112 |
| Ibiza | 84 |
| Formentera | 18 |
| **Total** | **614** (38 nodos, 490 vías, 86 relaciones; **456 con nombre**) |

> Nota: una versión anterior sumaba cuadrantes con solape y daba 639/471; esta cifra
> corresponde a la consulta única definitiva sobre todo el bbox de Baleares.

## Provenance

- **Fuente:** OpenStreetMap (vía Overpass API).
- **Licencia:** [Open Database License (ODbL) 1.0](https://www.openstreetmap.org/copyright)
  — requiere atribución `© OpenStreetMap contributors` y compartir derivados bajo ODbL.
- **Fecha de captura:** 2026-11-27 (base OSM `timestamp_osm_base` 2026-11-26).
- **Copyright:** declarado por Overpass en cada respuesta:
  "The data included in this document is from www.openstreetmap.org. The data is made
  available under ODbL."

## Mapeo de etiquetas OSM → ServiceId

Los objetos `natural=beach` solo traen **algunas** etiquetas de servicio; aseos, duchas,
aparcamiento y restauración suelen ser features `amenity` separadas (requieren join espacial):

| ServiceId | Etiqueta OSM (sobre la playa) | Feature separada (join espacial) |
| --- | --- | --- |
| `Socorrista` | `lifeguard=yes` · `supervised=yes` | `emergency=lifeguard` |
| `Acceso adaptado` | `wheelchair=yes`/`limited` | — |
| `Aseos` | — | `amenity=toilets` |
| `Duchas` | — | `amenity=shower` |
| `Aparcamiento` | `parking` (raro) | `amenity=parking` |
| `Chiringuito` | — | `amenity=restaurant`/`bar`/`cafe` |
