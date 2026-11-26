# Fuentes de datos y licencias

> **Estado:** investigación inicial. La app sigue usando datos de demostración hasta verificar la licencia y el acceso a las muestras de la fuente principal.

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

- **No se sustituye el seed** hasta confirmar que la fuente principal permite reutilizar los datos y ofrece muestras con fecha y calidad.
- El importador exige `source_name`, `source_url`, `source_license` y `updated_at`; sin esos campos no genera datos.
- La prioridad es **NÁYADE / Censo de aguas de baño** para calidad y **ADEAC** para bandera azul. IDEIB queda para cartografía.
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
