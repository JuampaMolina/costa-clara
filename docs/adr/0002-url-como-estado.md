# ADR 0002 — La URL como estado de la consulta

- **Estado:** aceptada (ya implementada)
- **Fecha:** 2026-11-26
- **Commit de referencia:** `9005c31`

## Contexto

Los filtros y la playa abierta tienen que sobrevivir a una recarga y poder enviarse a otra persona. No hay sesión de servidor ni cuentas. Un estado solo en memoria se pierde al recargar; uno solo en `localStorage` no se comparte.

La home es la ruta `''`. No hay una ruta por playa (CC-53, abierto). El estado de consulta vive en la query string, leída al arrancar en `beaches-page.ts` y escrita con `Router.navigate` cuando cambian las signals.

## Decisión

Sincronizar la consulta con estos parámetros:

| Parámetro | Significado | Si falta o no es válido |
| --- | --- | --- |
| `q` | Texto de búsqueda | Sin búsqueda |
| `isla` | `mallorca`, `menorca`, `ibiza`, `formentera` | `todas` |
| `calidad` | Una de las cinco calidades del modelo | `todas` |
| `bandera` | `1` si solo bandera azul | Apagado |
| `favoritas` | `1` si el filtro de favoritas está activo | Apagado |
| `playa` | `id` de la ficha abierta | Ninguna ficha |

La escritura usa `replaceUrl: true` y no navega si la query no cambió. El enlace de compartir reconstruye `q`, `isla`, `calidad`, `bandera` y `playa`. Omite `favoritas`: el comentario del código dice que las favoritas son locales.

No van en la URL: el conjunto de favoritas (`localStorage`), la capa base (`costa-clara:basemap:v1`) y la posición del usuario.

`public/_redirects` (`/* /index.html 200`) hace que recargar `/?isla=mallorca` sirva la SPA. Sin eso, Pages devolvería 404 antes de que Angular leyera la query.

## Consecuencias

- Una URL como `/?isla=menorca&calidad=excelente&playa=cala-macarella` abre la misma vista en otro dispositivo. Los e2e cubren restaurar isla y calidad, sincronizar `playa` y conservar el estado al recargar.
- No hay historial por cada cambio de filtro: Atrás no deshace un filtro. A cambio, filtrar no llena la pila de navegación.
- Compartir no filtra por las favoritas de quien envía el enlace, porque ese conjunto no existe en el otro navegador. El filtro `favoritas=1` sí queda en la URL de la pestaña actual, así que una recarga local lo mantiene.
- Un `playa` desconocido no encuentra ficha (`selectedBeach` queda en `null`). No hay página propia por playa, así que el título dinámico y Open Graph dependen de esa query, no de una ruta indexable. URLs legibles y JSON-LD siguen en CC-53.
- El fallback SPA también entrega la app en rutas desconocidas. La página 404 es la de Angular (CC-06), no un 404 de HTTP.
- El estado de la URL no sustituye al de `localStorage`. Mezclarlos sin decirlo confundiría: la capa base se recuerda en este navegador y no forma parte del enlace compartido.
