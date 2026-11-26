# Fuentes de datos y licencias

> **Estado:** investigación verificada (nov 2026). Se confirmó la viabilidad de una API propia con
> OSM + EEA; la bandera azul (ADEAC) queda **bloqueada sin permiso**. Detalle completo en
> [docs/datos-reales.md](datos-reales.md). La app sigue usando datos de demostración (`demo`) hasta
> conectar la calidad real (CC-13).

## Confirmado (26–27 nov 2026)

| Fuente | Licencia | ¿Reutilizable? | Uso |
| --- | --- | --- | --- |
| OpenStreetMap (Overpass) | ODbL 1.0 | ✅ con atribución | Playas, servicios, geometría (639 playas Baleares) |
| EEA Bathing Water Directive | CC BY 4.0 | ✅ | Clasificación anual de calidad por zona |
| Censo Aguas de Baño (MITECO) | Atribución MITECO / CC BY 4.0 | ✅ | Zonas de baño (identificación/geometría) |
| GOIB / IDEIB | CC BY (GOIB); por capa (IDEIB) | ✅ | Cartografía, características físicas de playas |
| NÁYADE (Sanidad) | Sin términos abiertos | ❌ (solo visor) | Verificación manual |
| Bandera Azul (ADEAC) | Todos los derechos reservados | ❌ sin permiso escrito | No publicar el listado |

## Candidatas

| Dato | Fuente | Formato / acceso | Licencia / condiciones | Notas |
| --- | --- | --- | --- | --- |
| Calidad del agua | **NÁYADE** (Ministerio de Sanidad) y **Censo de Zonas de Aguas de Baño** (MITECO, datos.gob.es) | Visor y descargas; el censo se publica como WMS/descarga en datos.gob.es | **Verificar** condiciones de reutilización y si los resultados de muestras son descargables | Es la fuente oficial de zonas de baño; el censo puede incluir metadatos de la zona pero no siempre la serie de analíticas |
| Calidad del agua (alternativa) | Consejería de Salud / autoridad autonómica de Baleares | Portal de salud y datos abiertos | **Verificar** licencia y frecuencia | Útil para contraste y para muestras locales |
| Bandera azul | **ADEAC** (banderaazul.org) | Listado anual por comunidad y playa | **Solicitar/verificar** permiso de reutilización | Solo playas galardonadas; no cubre todas |
| Cartografía y accesos | **IDEIB** (Infraestructura de Datos Espaciales de las Illes Balears) | WMS/WFS y descargas | Licencia **por capa**; consultar metadatos de cada una | Buena para límites, accesos y equipamientos; no para calidad del agua |
| Mapa base | **OpenStreetMap**, OpenTopoMap, Esri World Imagery | Tiles XYZ | ODbL (OSM), CC-BY-SA (OpenTopoMap), atribución Esri | Ya integrados con atribución visible en el mapa |
| Municipios / islas | Cartografía oficial o INE | CSV/GeoJSON | **Verificar** | Se puede derivar de IDEIB o del censo |

## Decisión

- **No se sustituye el seed** hasta conectar la calidad real (CC-13). El PoC de esta rama demuestra el
  flujo OSM→`ServiceId` sin forzar `dataStatus: real`.
- El importador exige `source_name`, `source_url`, `source_license` y `updated_at`; sin esos campos no genera datos.
- **Calidad:** prioridad **EEA (CC BY 4.0)** — clasificación anual por zona; NÁYADE es la fuente primaria
  española pero **no es abierta** (verificación manual); el Censo MITECO da geometría/identificación.
- **Playas y servicios:** **OSM (ODbL)** — 639 playas muestreadas en Baleares.
- **Bandera azul (ADEAC):** **no reutilizable sin permiso escrito** (aviso legal §4); no publicar el listado.
- **Cartografía/municipios:** GOIB/IDEIB (CC BY / por capa) + Nominatim para municipio/isla.
- Los datos de demostración se mantienen etiquetados como tales (`dataStatus: 'demo'`). Al importar, el modelo pasa a `real` y la ficha muestra fuente, licencia y fecha.

## Flujo previsto

1. Descargar el CSV/JSON oficial (o consultar el WMS si no hay descarga).
2. Normalizar a `data/raw/beaches.csv` y `data/raw/samples.csv` (ver [data/README.md](../data/README.md)).
3. Ejecutar `npm run data:import`.
4. Revisar el diff de `src/app/core/data/beaches.generated.ts`.
5. Pasar unitarios, build y e2e; abrir PR.
6. Verificar una muestra de playas contra la fuente y revisar la atribución en la ficha.

## Checklist antes de publicar datos reales

- [ ] La licencia permite reutilización comercial/portfolio con atribución.
- [ ] Se han documentado la URL, la licencia y la fecha de cada fuente.
- [ ] Las calidades se mapean a `excelente/buena/suficiente/insuficiente/sin-datos` con un criterio escrito.
- [ ] Cada playa tiene al menos una muestra con fecha válida.
- [ ] La ficha muestra la fuente y la licencia (`source`).
- [ ] Se ha comprobado que el número de playas y sus coordenadas son correctos.
- [ ] No se hace scraping si los términos de uso lo prohíben; se usan descargas o APIs.

## Riesgos

- **Cobertura:** el censo puede no incluir la serie histórica de analíticas; haría falta otra fuente para el histórico.
- **Frecuencia:** la calidad se publica por temporada; no habrá datos nuevos en invierno.
- **Nombres:** las playas pueden aparecer con variantes (catalán/castellano); el `id` estable evita duplicados.
- **Licencias:** IDEIB tiene licencias por capa; no se puede asumir una licencia única.
- **Atribución:** OSM, OpenTopoMap y Esri ya se muestran en el mapa; no ocultar los controles de atribución.
