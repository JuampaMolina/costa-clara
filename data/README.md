# Datos

El importador convierte CSV en el modelo `Beach` y deja el resultado en `src/app/core/data/beaches.generated.ts`. Si ese archivo contiene datos, la app los usa automáticamente y `DATA_STATUS` pasa a `real`; si vuelve a `null`, se usa el seed de demostración.

## Ficheros

| Fichero | Obligatorio | Contenido |
| --- | --- | --- |
| `data/raw/beaches.csv` | Sí | Una fila por playa |
| `data/raw/samples.csv` | Sí | Una fila por muestra de calidad |

`data/raw/example/` contiene un fixture pequeño para probar el pipeline. **No es un dataset oficial**: los nombres son reales, pero la calidad, servicios y fechas son inventados.

## Columnas de `beaches.csv`

| Columna | Reglas |
| --- | --- |
| `id` | Slug único en minúsculas (`cala-macarella`) |
| `name`, `municipality`, `description` | Texto no vacío |
| `island` | `mallorca`, `menorca`, `ibiza` o `formentera` |
| `lon`, `lat` | Números dentro de Baleares (lon 1–4.5, lat 38.5–40.2) |
| `services` | Lista separada por `;`, `,` o `\|`; valores de `SERVICES` |
| `blue_flag` | `0/1` o `true/false` |
| `blue_flag_year` | Opcional, año 2000–2100 |
| `source_name`, `source_url`, `source_license` | Obligatorios; URL válida |
| `updated_at` | `YYYY-MM-DD` |
| `accessibility` | Opcional: `adaptada`, `parcial` o `sin-datos` |

Servicios admitidos: `Socorrista`, `Aseos`, `Duchas`, `Aparcamiento`, `Acceso adaptado`, `Chiringuito`.

## Columnas de `samples.csv`

| Columna | Reglas |
| --- | --- |
| `beach_id` | Debe existir en `beaches.csv` |
| `date` | `YYYY-MM-DD`; no se repite para la misma playa |
| `quality` | `excelente`, `buena`, `suficiente`, `insuficiente` o `sin-datos` |

La calidad y `lastSample` de la playa se derivan de la muestra más reciente. Cada playa debe tener al menos una muestra.

## Comandos

```powershell
# Importa data/raw y actualiza la app
npm run data:import

# Prueba el pipeline con el fixture, sin tocar la app
npm run data:example
```

`data:example` escribe en `data/generated/example.ts` (ignorado por git).

## Validación

El importador acumula todos los errores y falla sin escribir nada si hay alguno: isla/calidad/servicio desconocidos, coordenadas fuera de rango, ids duplicados, muestras huérfanas o duplicadas, fechas mal formadas o falta de fuente/licencia.

## Fuentes y licencias

Antes de importar datos reales, documenta la fuente y su licencia en [docs/datos.md](../docs/datos.md). No se deben inventar valores oficiales ni publicar datos sin atribución.
