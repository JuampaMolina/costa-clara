# ADR 0003 — Seed de demostración e importador CSV

- **Estado:** aceptada (ya implementada)
- **Fecha:** 2026-11-26
- **Commit de referencia:** `9005c31`

## Contexto

La demo tiene que enseñar mapa, filtros e histórico antes de que la licencia de NÁYADE, el censo de zonas de baño o ADEAC esté verificada. [docs/datos.md](../datos.md) prohíbe sustituir el seed hasta que la fuente permita reutilizar los datos y dé muestras con fecha y calidad. [HANDOFF.md](../../HANDOFF.md) prohíbe un backend mientras el seed en TypeScript baste, y prohíbe inventar datos oficiales.

Hacen falta, a la vez, datos que la app pueda renderizar hoy y un camino para datos reales que no confunda los dos.

## Decisión

Dos orígenes, uno activo:

1. **Seed** en `src/app/core/data/beaches.seed.ts`: 19 playas (8 Mallorca, 4 Menorca, 4 Ibiza, 3 Formentera). Nombres y coordenadas reales. Calidad, servicios, bandera azul y fechas son de ejemplo. El comentario del fichero lo dice.
2. **Importador** (`npm run data:import`, `scripts/import-data.ts` + `buildDataset`). Lee `data/raw/beaches.csv` y `data/raw/samples.csv`, valida y, solo si no hay errores, escribe `src/app/core/data/beaches.generated.ts`.

`beaches.ts` elige así: si `GENERATED_BEACHES` es un array, `DATA_STATUS` es `real` y la app usa ese array; si es `null`, usa el seed y el estado es `demo`. En `9005c31` el generado es `null`.

El importador no escribe nada si acumula errores. Exige `source_name`, `source_url` (URL válida), `source_license` y `updated_at`. Rechaza islas, calidades o servicios desconocidos, coordenadas fuera de lon 1–4.5 y lat 38.5–40.2, ids duplicados, muestras huérfanas o repetidas y playas sin muestra. La calidad y `lastSample` salen de la muestra más reciente. Cada playa importada queda con `dataStatus: 'real'`.

`npm run data:example` prueba el mismo pipeline contra `data/raw/example/` y escribe en `data/generated/example.ts`, que git ignora. El fixture no es un dataset oficial.

La ficha muestra «Datos de demostración» cuando `dataStatus !== 'real'`. Si es real, muestra fuente, licencia y fecha. No hay fetch en tiempo de ejecución ni base de datos.

## Consecuencias

- La demo se puede publicar sin esperar a la licencia. El coste es explícito: quien no lea el badge puede tomar la calidad de ejemplo por oficial. El badge, el banner y el e2e que busca «Datos de demostración» existen para impedir esa confusión.
- Un CSV malo no borra el seed: el script sale con error y no toca el generado. Un CSV bueno sí lo sustituye en el siguiente build; volver a `null` restaura la demo.
- Actualizar datos es un commit del fichero generado, revisable en un PR. No hay descarga programada (CC-13). Si la fuente cambia de formato, hoy no hay un workflow que falle en público: falla quien lance el importador.
- El rango de coordenadas y el catálogo de islas impiden colar, sin cambiar código, un censo de toda España. También impiden una playa balear cuyas coordenadas caigan fuera de esa caja.
- No hay secreto ni servicio que operar. El dataset viaja en el bundle. Con 19 playas no importa; un censo completo hará crecer `beaches.generated.ts` y el chunk inicial.
- Los tests del importador cubren un caso válido y los rechazos (7 de los 26 unitarios). No cubren una descarga real: esa fuente aún no está en `data/raw/`.
