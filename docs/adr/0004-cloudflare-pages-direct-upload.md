# ADR 0004 — Cloudflare Pages por Direct Upload

- **Estado:** aceptada (ya implementada)
- **Fecha:** 2026-11-26
- **Commit de referencia:** `9005c31`

## Contexto

La app es un build estático de Angular (`dist/costa-clara/browser`). No hay backend ni base de datos. Hace falta una URL pública estable, un deploy repetible en cada push a `main` y un sitio donde no vivan tokens.

Cloudflare Pages admite conectar el repositorio desde el dashboard o subir el artefacto con Wrangler (Direct Upload). [docs/despliegue.md](../despliegue.md) describe las dos y deja activa la segunda. El proyecto de Pages se llama `costa-clara`. La producción es <https://costa-clara-k23.pages.dev>.

## Decisión

Publicar con Direct Upload desde GitHub Actions, no con la integración Git del dashboard.

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) corre en cada push a `main` y por `workflow_dispatch`:

1. `npm ci` con Node 22.
2. `npm run build`.
3. `npx wrangler pages deploy dist/costa-clara/browser --project-name costa-clara --branch main`.

Wrangler está en `devDependencies` (`^4.168.0`) para fijar la versión. El script `npm run deploy` hace el mismo build y upload a mano. El token (`CLOUDFLARE_API_TOKEN`, permiso Pages Edit) y `CLOUDFLARE_ACCOUNT_ID` son secretos de Actions. No se commitean. `WRANGLER_SEND_METRICS` va a `false`.

La concurrencia `deploy-production` cancela un deploy anterior si llega otro push. CI (`.github/workflows/ci.yml`) corre en paralelo: unitarios, build y e2e. No es un job del que dependa el deploy.

`public/_redirects` se copia al build y reescribe toda ruta a `index.html` con 200, para que la query de filtros sobreviva a una recarga. El detalle está en el [ADR 0002](./0002-url-como-estado.md).

Si más adelante se conecta el repo desde el dashboard, hay que desactivar `deploy.yml`. Si no, cada push se publicaría dos veces.

## Consecuencias

- El artefacto publicado es el de `npm run build`, el mismo comando que CI. No hay un build distinto en la infraestructura de Pages.
- El token es una credencial de escritura. La rotación está descrita en [docs/despliegue.md](../despliegue.md): token nuevo, `gh secret set`, revocar el anterior, `workflow_dispatch`.
- Direct Upload no crea una preview por pull request. El propio doc de despliegue lo dice. Una preview exigiría otro workflow con `--branch` y un comentario en el PR; no existe.
- CI y Deploy no se esperan. Un test rojo no impide, por sí solo, que el workflow de deploy publique. El backlog (CC-02) pide que el check sea obligatorio para mergear; este ADR no afirma que la protección de rama esté configurada, porque el repo no lo documenta.
- El plan y los límites de Pages pueden cambiar. [docs/despliegue.md](../despliegue.md) pide revisarlos antes de asumir tráfico alto. No hay caché de datos de aplicación: un deploy nuevo sustituye el sitio entero, seed incluido.
- Recargar `/?isla=menorca&calidad=excelente` depende del `_redirects`. Quitarlo rompe el estado en la URL aunque el ADR 0002 siga escribiendo la query.
