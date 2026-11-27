# Viabilidad de datos reales para Baleares (PoC)

> **Estado:** investigación verificada con peticiones reales el 26–27 nov 2026. Se propone una
> API propia alimentada por fuentes públicas con licencia de reutilización, porque **ninguna API
> oficial cubre por sí sola playas + servicios + calidad + bandera azul** en Baleares.
>
> Rama: `feat/real-data`. No sustituye el seed ni fuerza `dataStatus: real`.

---

## 1. Matriz de viabilidad

| Fuente | URL | Licencia | Formato | Cobertura Baleares | ¿Calidad a nivel de muestra? | Esfuerzo | Riesgos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **EEA WISE Bathing Water** — *Bathing Water Directive · Status of bathing water* | https://www.eea.europa.eu/data-and-maps/data/bathing-water-directive-status-of-bathing-water-5 (datahub `c3858959-90da-4c1b-b9ca-492db0e514df`, DOI `10.2909/30e5d599-…`) | **CC BY 4.0** (política EEA + metadatos) | CSV / GeoPackage / WFS (SDI) | Sí: ~22 000 zonas UE, incluye las de Baleares (reportadas por España) | **Clasificación anual** (excelente/buena/suficiente/insuficiente) por zona; el histórico de analíticas por muestra está en *Monitoring and Classification* | Bajo (descarga + filtro por ES-IB) | El endpoint SDI (`sdi.eea.europa.eu`) no responde desde este sandbox; hay que confirmar la descarga desde CI/local |
| **NÁYADE** (Ministerio de Sanidad) | https://nayadeciudadano.sanidad.gob.es/ | **Sin términos de reutilización publicados** (solo acceso ciudadano/profesional) | Visor web (sin API/descarga abierta) | Sí (todas las zonas censadas) | Sí, pero **no descargable**: el visor no expone CSV/JSON | Alto (habría que pedir acceso profesional) | No es fuente abierta; usarla requiere autorización |
| **Censo de Zonas de Aguas de Baño** (MITECO) | https://www.miteco.gob.es/es/cartografia-y-sig/ide/descargas/agua/censo-aguas-bano.html | **Atribución MITECO** («© Ministerio para la Transición Ecológica…»); en datos.gob.es consta **CC BY 4.0** | Shapefile / GML / KMZ / GeoPackage (2020–2025) | Sí, nacional (cobertura de **puntos**) | No: identifica la zona de baño, **no** trae la serie de analíticas | Bajo (descarga zip) | La descarga directa devuelve una página de portal (requiere navegador/formulario) |
| **Bandera Azul** (ADEAC) | https://www.banderaazul.org/ (PDF anual *Relación de Playas Galardonadas*) | **Todos los derechos reservados** — aviso legal §4 prohíbe «distribución, modificación, cesión o comunicación pública» | PDF | Sí | n/a | Alto (requiere **permiso escrito** de ADEAC) | **Bloqueado sin autorización**: no redistribuir el listado |
| **Playas y servicios** (OpenStreetMap) | Overpass API https://overpass-api.de/api/interpreter | **ODbL 1.0** (atribución + compartir derivados) | JSON (Overpass) | Sí: **614 playas** muestreadas (ver §2) | n/a (geometría/servicios) | Bajo | Servicios de aseos/duchas/restauración son features `amenity` separadas (join espacial) |
| **Cartografía / municipios** (IDEIB · GOIB) | https://ideib.caib.es/ · https://intranet.caib.es/opendatacataleg | **CC BY** (GOIB, atribución «Govern de les Illes Balears»); IDEIB por capa | WMS/WFS + descarga; «Característica física de les platges» en GeoJSON/CSV | Sí | n/a | Medio | Licencia por capa en IDEIB; verificar metadatos de cada capa |

### Conclusión de la matriz

- **Calidad del agua**: la fuente reutilizable es **EEA (CC BY 4.0)** — clasificación anual por zona. NÁYADE es la fuente primaria española pero **no es abierta**; el Censo MITECO da la geometría/identificación pero no la calidad.
- **Bandera azul**: **no reutilizable sin permiso** de ADEAC. Alternativa: omitirla o pedir autorización explícita.
- **Playas y servicios**: **OSM (ODbL)** cubre geometría, nombres y parte de los servicios; es la base más completa y abierta.

---

## 2. Conteos reales (verificados)

### Playas OSM en Baleares (`natural=beach`)

| Isla (por centroide) | Elementos con nombre |
| --- | --- |
| Mallorca | 242 |
| Menorca | 112 |
| Ibiza | 84 |
| Formentera | 18 |
| **Total** | **614** (38 nodos · 490 vías · 86 relaciones; **456 con nombre**) |

Consulta Overpass sobre el bbox único de Baleares (`38.4,1.0,40.3,4.6`), capturada el 27 nov 2026.
Ver [data/raw/overpass/README.md](../data/raw/overpass/README.md). (Corrige un conteo anterior de
639/471 que sumaba cuadrantes con solape.)

Etiquetas de servicio presentes **sobre las propias playas**:

| Etiqueta | Conteo |
| --- | --- |
| `surface` | 263 |
| `supervised` | 40 |
| `lifeguard` | 33 |
| `access` | 35 |
| `nudism` | 26 |
| `wheelchair` | 9 |
| `fee` | 4 |

`toilets`, `shower`, `parking`, `restaurant/bar/cafe` no están sobre la playa: son features
`amenity` cercanas (requieren join espacial, §5).

### Matching con las 19 del seed

| id seed | OSM `name` coincidente | ¿Match? |
| --- | --- | --- |
| es-trenc | `Platja d'es Trenc` | ✅ |
| cala-mondrago | — (sin `natural=beach` con ese nombre) | ⚠️ variante de nombre/geometría |
| cala-millor | `Platja de Cala Millor` | ✅ |
| platja-de-palma | `Platja de Palma` | ✅ |
| port-de-soller | — | ⚠️ |
| cala-varques | `Cala Varques` | ✅ |
| sa-calobra | — | ⚠️ |
| cala-deia | — | ⚠️ |
| cala-macarella | `Cala Macarella` | ✅ |
| son-bou | `Son Bou` | ✅ |
| cala-en-turqueta | `Cala en Turqueta` | ✅ |
| punta-prima | `Platja de Punta Prima` | ✅ |
| cala-comte | `Platges de Comte` | ✅ |
| cala-dhort | `Cala d'Hort` | ✅ |
| platja-den-bossa | `Platja d'en Bossa` | ✅ |
| cala-salada | `Cala Salada` | ✅ |
| ses-illetes | — (en OSM coincide `Platja d'Illetes` de Mallorca; el de Formentera usa otro nombre) | ⚠️ |
| cala-saona | `Platja cala Saona` | ✅ |
| platja-de-migjorn | `Platja de Migjorn` | ✅ |

**14/19 con coincidencia directa** por nombre; 5 requieren sinónimos (`name:ca`/`alt_name`) o
emparejado por coordenadas. La variante catalana (`name:ca`) y las etiquetas `wikidata`/`wikipedia`
permiten desambiguar (`Platja d'Illetes` en Mallorca vs. `Ses Illetes` en Formentera).

---

## 3. Propuesta de API propia

Como las fuentes oficiales no se integran solas (EEA=calidad, MITECO=zonas, OSM=servicios,
ADEAC=bloqueado), se propone **una API estática generada** que agrega las fuentes reutilizables.

### Esquema JSON

**`GET /api/beaches.json`** — listado completo.

```json
{
  "meta": {
    "generated_at": "2026-11-27T00:00:00Z",
    "count": 614,
    "sources": [
      { "name": "OpenStreetMap", "url": "https://www.openstreetmap.org/copyright", "license": "ODbL 1.0" },
      { "name": "EEA Bathing Water Directive", "url": "https://www.eea.europa.eu/…", "license": "CC BY 4.0" }
    ]
  },
  "beaches": [
    {
      "id": "es-trenc",
      "name": "Platja d'es Trenc",
      "municipality": "Campos",
      "island": "mallorca",
      "lon": 2.98276,
      "lat": 39.34332,
      "services": ["Socorrista", "Acceso adaptado"],
      "quality": "sin-datos",
      "last_sample": null,
      "blue_flag": null,
      "source": { "osm_id": 123456, "osm_type": "way" }
    }
  ]
}
```

**`GET /api/beaches/:id.json`** — ficha de una playa (mismo objeto + `samples`).

**`GET /api/samples.json`** — muestras de calidad (`beach_id`, `date`, `quality`, `source`).

### Generación desde `data/raw`

1. `scripts/fetch-osm.ts` → descarga Overpass a `data/raw/overpass/` (o usa el cache commiteado).
2. `scripts/fetch-eea.ts` → descarga la clasificación EEA y la filtra a ES-IB.
3. `scripts/build-api.ts` → junta ambas, aplica el mapeo OSM→`ServiceId`, y escribe
   `public/api/beaches.json`, `public/api/beaches/{id}.json`, `public/api/samples.json`.
4. El mismo pipeline alimenta `npm run data:import` (CSV) cuando la calidad esté validada.

### Estático en Cloudflare Pages **vs** Pages Functions

| Opción | Ventajas | Inconvenientes | 
| --- | --- | --- |
| **Estático** (JSON pregenerado en `public/`) | Gratis, sin cómputo en runtime, cache CDN, cero latencia fría, reproducible | El JSON se regenera en build (o con Pages Direct Upload); no hay query dinámica |
| **Pages Functions** (proxy a fuentes) | Datos siempre frescos, filtros por query | Cold starts, cuota, hay que paginar/cachear, depende de endpoints externos |

**Recomendación: estático.** El dataset es pequeño (456 playas con nombre ⇒ ~180 KB), la frecuencia de
actualización es estacional (anual/mensual, no en tiempo real) y la app ya consume un bundle local.
La regeneración se hace en CI (GitHub Actions) y se publica con `wrangler pages deploy`.

### Actualización

- Workflow mensual/estacional que ejecuta los scripts de fetch + build-api + import.
- El cron debe alinearse con la publicación de la fuente (EEA publica la temporada anterior en
  primavera/verano; el censo MITECO en marzo-abril).
- Ver [docs/actualizacion-datos.md](actualizacion-datos.md) (workflow existente).

### CORS / cache / atribución

- **CORS:** `Access-Control-Allow-Origin: *` (datos públicos) o el origen de la app.
- **Cache:** `Cache-Control: public, max-age=86400, stale-while-revalidate` en los JSON; `ETag`/`Last-Modified` con `generated_at`.
- **Atribución:** cada respuesta incluye `meta.sources` con nombre, URL y licencia; la ficha de la
  app muestra la atribución (OSM «© OpenStreetMap contributors», EEA CC BY 4.0, MITECO si procede).
- **Licencia del dataset agregado:** ODbL para la parte OSM (obliga a atribuir y compartir igual);
  CC BY 4.0 para la parte EEA. Documentar ambas en el `meta`.

---

## 4. Recomendación

1. **Adoptar la API estática** (JSON en `public/api/` servido por Cloudflare Pages) como fuente de
   la app, generada desde OSM (playas/servicios) + EEA (calidad) + MITECO (zonas, para contraste).
2. **No publicar bandera azul** hasta obtener permiso escrito de ADEAC (o sustituirla por un enlace
   al listado oficial sin reproducirlo).
3. **Tratar NÁYADE como fuente de verificación manual**, no como API: el Censo MITECO y la EEA ya
   exponen lo esencial de forma abierta.
4. **Mantener `dataStatus: demo`** hasta que `data:import` reciba calidad real validada; el PoC de
   esta rama demuestra el flujo sin forzar datos reales.

---

## 5. Pruebas del PoC

- `data/raw/overpass/` — muestreo crudo OSM (JSON + README con consulta, licencia y mapeo de tags).
- `scripts/sample-osm.ts` — agrega el muestreo y genera `data/generated/beaches-osm.json` con 11
  playas reales del seed (nombre/coordenadas/servicios reales, calidad `sin-datos`).
- Ejecución: `npx tsx scripts/sample-osm.ts`.

```text
✓ 11 playas muestreadas -> data/generated/beaches-osm.json
  Total OSM en Baleares: 614 (456 con nombre).
```

### Mapeo OSM → `ServiceId` aplicado

| ServiceId | Origen (sobre la playa) | Origen (feature `amenity` cercana, join espacial ≤ 150 m) |
| --- | --- | --- |
| `Socorrista` | `lifeguard=yes` · `supervised=yes` | `emergency=lifeguard` |
| `Acceso adaptado` | `wheelchair=yes`/`limited` | — |
| `Aseos` | — | `amenity=toilets` |
| `Duchas` | — | `amenity=shower` |
| `Aparcamiento` | — | `amenity=parking` |
| `Chiringuito` | — | `amenity=restaurant`/`bar`/`cafe` |

### Limitaciones conocidas

- La **descarga EEA** no se pudo validar desde este sandbox (`sdi.eea.europa.eu` y
  `discodata.eea.europa.eu` no responden); se confirma licencia CC BY 4.0 y existencia del dataset,
  pero la URL de descarga debe probarse desde CI/local.
- La **descarga del censo MITECO** devuelve una página de portal (requiere navegador); la URL oficial
  y la licencia sí están confirmadas.
- El **municipio/isla** de las playas OSM no es un atributo directo: se deriva de las coordenadas
  (PoC) o de Nominatim/reverse-geocode (pipeline completo).
