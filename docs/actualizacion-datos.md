# Actualización programada de datos

**Estado:** workflow listo; sin fetch automático hasta validar la fuente (CC-10).

## Flujo

El workflow [`.github/workflows/update-data.yml`](../.github/workflows/update-data.yml) se ejecuta:

- Automáticamente el día 1 de cada mes a las 06:00 UTC (`cron: "0 6 1 * *"`).
- Manualmente desde **Actions → Actualizar datos → Run workflow**.

Pasos:

1. `npm ci` (Node 22, con caché de npm).
2. Comprueba `data/raw/beaches.csv`. Si **no existe**, imprime `Sin fuente configurada` y termina con éxito sin tocar nada.
3. Si existe, ejecuta `npm run data:import`, que valida y regenera `src/app/core/data/beaches.generated.ts`.
4. Abre un PR en la rama `data/update-AAAA-MM` **solo si** `beaches.generated.ts` cambió. El PR lo crea [peter-evans/create-pull-request@v8](https://github.com/peter-evans/create-pull-request).

Si la fuente cambia de formato, `npm run data:import` falla y no se abre PR: el workflow queda en rojo en vez de publicar datos vacíos (ver [data/README.md](../data/README.md)).

## Por qué no hay fetch automático todavía

La actualización solo importa lo que ya está en `data/raw/`. Descargar la fuente oficial directamente desde el workflow es el objetivo final de CC-13, pero depende de **CC-10**: hay que confirmar la licencia y el mecanismo de acceso (descarga o API) de la fuente principal. Hasta entonces:

- No hay una URL oficial validada que se pueda consultar sin asumir condiciones de reutilización.
- El importador exige `source_name`, `source_url`, `source_license` y `updated_at`; sin esos metadatos no genera datos.
- El paso de comprobación mantiene el workflow en verde mientras `data/raw/beaches.csv` no esté preparado, de modo que no se abre un PR vacío cada mes.

## Cómo añadir `scripts/fetch-data.ts` cuando se valide la fuente

1. Crear `scripts/fetch-data.ts` que:
   - Lea la URL oficial y su licencia desde configuración (variables del workflow o un fichero en `data/`), no desde código hardcodeado.
   - Descargue el recurso con `fetch` de Node (mejor que `curl` en el workflow: la lógica queda versionable y testeable).
   - Normalice la salida a `data/raw/beaches.csv` y `data/raw/samples.csv` respetando el esquema de [data/README.md](../data/README.md).
   - Falle con un mensaje claro si la fuente cambia de formato; nunca debe escribir un CSV vacío o parcial.
2. Añadir un script en `package.json` (p. ej. `"data:fetch": "tsx scripts/fetch-data.ts"`). Esto es parte del ticket de tooling (CC-05), no de CC-13.
3. En `update-data.yml`, insertar un paso `run: npm run data:fetch` **antes** de `npm run data:import`, y sustituir la comprobación de existencia por una comprobación de que el fetch produjo `data/raw/beaches.csv`.
4. Ajustar el cron a la frecuencia real de publicación de la fuente (los censos de aguas de baño se publican por temporada, no mensualmente).

## Checklist de revisión del PR

Antes de fusionar un PR generado por el workflow:

- [ ] El diff de `beaches.generated.ts` es el esperado: número de playas, coordenadas y calidades correctos.
- [ ] Cada playa tiene `source_name`, `source_url`, `source_license` y `updated_at` válidos.
- [ ] Las calidades se mapean a `excelente/buena/suficiente/insuficiente/sin-datos` con un criterio escrito.
- [ ] `npm run build` y los tests (unitarios y e2e) pasan en CI.
- [ ] Una muestra de playas coincide con la fuente (no se inventan valores).
- [ ] La ficha muestra la fuente, la licencia y la fecha de actualización.
- [ ] No hay datos vacíos: el importador falla antes de escribir si hay errores.

## Riesgos

- Si la fuente cambia de formato, `npm run data:import` falla y no se abre PR; el workflow queda en rojo (comportamiento deseado, no publica datos vacíos).
- `data/raw/beaches.csv` todavía no existe en el repo (solo hay el fixture `data/raw/example/`); hasta que se añada la fuente o el fetch, la actualización mensual no hace nada.
- El cron es mensual; si la fuente publica con otra frecuencia, hay que ajustar el cron en `update-data.yml`.
- Dos ejecuciones en el mismo mes reutilizan la misma rama `data/update-AAAA-MM` y actualizan el PR existente en vez de crear duplicados.
