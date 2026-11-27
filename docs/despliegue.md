# Despliegue en Cloudflare Pages

**Estado:** desplegado y automatizado.

- **Producción:** <https://costa-clara-k23.pages.dev>
- **Proyecto Cloudflare:** `costa-clara` (Direct Upload)
- **Workflow:** [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- **Build:** `npm run build` → `dist/costa-clara/browser`

## Cómo funciona

Cada push a `main` (o una ejecución manual del workflow) hace:

1. `npm ci`
2. `npm run build`
3. `npx wrangler pages deploy dist/costa-clara/browser --project-name costa-clara --branch main`

El workflow `.github/workflows/ci.yml` se ejecuta en paralelo y valida tests y build antes de dar el commit por bueno. La concurrencia `deploy-production` cancela despliegues antiguos si llegan pushes seguidos.

### Secretos del repositorio

| Secreto | Contenido |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token con permiso **Cloudflare Pages: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | `d4b54619e679a7915a78109c61fe2075` |

Los secretos se configuran con `gh secret set` o desde **Settings → Secrets and variables → Actions**. Nunca se commitean.

## Deploy manual

```powershell
$env:CLOUDFLARE_API_TOKEN = '<token>'
$env:CLOUDFLARE_ACCOUNT_ID = '<account-id>'
npm run deploy
```

El script `deploy` compila y sube el resultado. Wrangler está en `devDependencies` para que la versión sea reproducible.

## Rotación del token

El token permite publicar en la cuenta: trátalo como una credencial de escritura.

1. Crea un token nuevo en **My Profile → API Tokens** con permiso `Cloudflare Pages: Edit` y, si es posible, limitado a la cuenta.
2. Actualiza el secreto:
   ```powershell
   gh secret set CLOUDFLARE_API_TOKEN --body '<token-nuevo>'
   ```
3. Revoca el token anterior en el dashboard.
4. Lanza el workflow **Deploy** con `workflow_dispatch` para comprobar que sigue publicando.

## Rutas SPA

`public/_redirects` contiene:

```
/*    /index.html   200
```

Angular copia ese fichero a la raíz del build, así que recargar `/?isla=mallorca` o una URL profunda devuelve la app en vez de un 404.

## Sitemap

`public/sitemap.xml` se genera desde el dataset y no se edita a mano:

```powershell
npm run sitemap:generate
```

Incluye la home y una URL `/?playa=id` por cada playa activa, con `lastmod` al día en que se genera. La lógica está en `src/app/core/utils/sitemap.ts` (`buildSitemap`, pura y con tests) y el script en `scripts/generate-sitemap.ts`, que acepta `--date YYYY-MM-DD` y `--base-url <url>`.

`npm run data:import` también regenera el sitemap tras importar, así que una actualización de datos deja `sitemap.xml` al día sin pasos extra.

## Verificación

- `https://costa-clara-k23.pages.dev/` devuelve 200 y pinta el mapa.
- `/?isla=menorca&calidad=excelente` mantiene los filtros al recargar.
- Una ruta inexistente devuelve la app (la página 404 propia es el ticket CC-06).
- En **Workers & Pages → costa-clara → Deployments** aparece un deployment `production` por cada push.
- El build tarda ~3 s y el bundle inicial ronda los 381 kB + 330 kB del mapa diferido (límite de warning: 700 kB).

## Alternativa: integración Git del dashboard

También se puede conectar el repo desde **Workers & Pages → Create → Pages → Connect to Git**. Si se hace, hay que desactivar o borrar `deploy.yml` para no desplegar dos veces. Con la integración Git, Cloudflare necesita su propia autorización de GitHub y no usa los secretos de Actions.

## Notas

- Direct Upload no crea previews por PR; si se quieren, se puede añadir un workflow que despliegue con `--branch=${{ github.head_ref }}` y comente la URL en el PR.
- No hay backend ni base de datos: todo el sitio es estático.
- El plan gratuito de Pages cubre builds ilimitados en repos públicos; revisa los límites actuales antes de asumir tráfico alto.
