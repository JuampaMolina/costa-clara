# Privacidad y analítica

> **Estado:** servicio de analítica integrado en la interfaz (CC-43); sin proveedor conectado por defecto.

Costa Clara mide solo lo imprescindible para saber si la app es útil, sin invadir la privacidad de quien la usa. La analítica es **sin cookies, sin datos personales y sin red por defecto**: por sí misma no llama a ningún servidor.

## Qué se mide

El servicio [`analytics.ts`](../src/app/core/services/analytics.ts) registra seis eventos agregados:

| Evento         | Cuándo se dispara                   | Propiedades típicas                         |
| -------------- | ----------------------------------- | ------------------------------------------- |
| `search`       | Al buscar playas (tras el debounce) | `queryLength`, `results` (sin texto crudo)  |
| `filter`       | Al cambiar filtros                  | `type`, `value` o `active`, `results`       |
| `beach_open`   | Al abrir la ficha de una playa      | `beach` (id), `island`                      |
| `compare_open` | Al abrir el comparador              | `count` (número de playas)                  |
| `share`        | Al compartir ficha o comparativa    | `beach` (id) o `target` + `count`, `method` |
| `favorite`     | Al marcar o desmarcar favorita      | `beach` (id), `active`                      |

Las propiedades son siempre escalares (texto, número o booleano) y el servicio descarta en tiempo de ejecución cualquier objeto anidado o valor no primitivo.

## Qué no se recoge

- **Nada de cookies:** no se leen ni se escriben cookies propias ni de terceros.
- **Nada de datos personales ni búsquedas crudas:** no se recoge IP, correo, nombre, ubicación exacta, identificadores de usuario ni el texto literal introducido en el buscador (solo su longitud y el número de resultados). Las coordenadas de la playa nunca se envían como parte de la analítica (solo el `id` estable de la playa).
- **Nada de red por defecto:** `track` emite un `CustomEvent` (`costa-clara:analytics`) dentro de la página y no contacta con ningún servidor.

## Cómo funciona

`AnalyticsService.track(event, props)`:

1. Limpia las propiedades (solo escalares).
2. Emite `CustomEvent('costa-clara:analytics')` con `{ event, props }`.
3. Si existe `window.plausible`, reenvía el evento a Plausible; si no, termina sin enviar nada.

Si un proveedor falla o lanza una excepción, se captura y la app sigue funcionando: la analítica nunca rompe la navegación.

## Cómo conectar un proveedor (Plausible)

Sin tocar el servicio, basta con cargar el script de [Plausible](https://plausible.io/) en `src/index.html` (`script.js` con tu dominio). En cuanto `window.plausible` esté definido, los eventos de Costa Clara se reenvían automáticamente.

Ejemplo del snippet en `src/index.html`:

```html
<script defer data-domain="tu-dominio.com" src="https://plausible.io/js/script.js"></script>
```

Alternativa sin proveedor: un módulo de la propia app puede escuchar el `CustomEvent` y decidir qué hacer con él (agregar métricas en memoria, depurar en desarrollo, etc.), sin que el resto del código cambie.

## Reglas para quien añada llamadas a `track`

- Solo eventos agregados y anónimos; nunca PII (sin emails, IPs ni identificadores de usuario).
- Las propiedades describen la interacción, no a la persona.
- No pasar datos de la ficha que puedan identificar a un usuario concreto; usar el `id` de la playa, no coordenadas exactas.

## Riesgos

- Si se conecta Plausible, el propio script del proveedor gestiona la privacidad (Plausible no usa cookies y es compatible con GDPR). Hay que mantener esa elección documentada aquí.
- Añadir eventos nuevos sin revisar las propiedades podría colar datos sensibles; por eso el servicio descarta valores no primitivos en tiempo de ejecución.
- El `CustomEvent` es visible en la consola del navegador; no debe transportar nada que no se quiera exponer.
