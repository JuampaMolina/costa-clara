# Despliegue en Cloudflare Pages

El repo se despliega como sitio estático: Angular genera `dist/costa-clara/browser` y Cloudflare Pages lo sirve con CDN y HTTPS.

## Opción A · Integración Git (recomendada)

1. Entra en <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autoriza GitHub y elige el repo `JuampaMolina/costa-clara`.
3. Configura el build:

   | Ajuste | Valor |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | `Angular` (o `None`) |
   | Build command | `npm run build` |
   | Build output directory | `dist/costa-clara/browser` |
   | Root directory | `/` |
   | Variable de entorno | `NODE_VERSION=22` |

4. **Save and Deploy**. El primer build tarda unos minutos.
5. Cada push a `main` publica producción; cada PR genera una preview con su propia URL.

Con esta opción no hay tokens en GitHub: Cloudflare habla directamente con el repo.

## Opción B · Wrangler desde local o CI

Si prefieres desplegar por CLI, crea un token en **My Profile → API Tokens** con permiso `Cloudflare Pages: Edit` y exporta:

```powershell
$env:CLOUDFLARE_API_TOKEN = '<token>'
$env:CLOUDFLARE_ACCOUNT_ID = '<account-id>'
```

Primer despliegue manual:

```powershell
npx wrangler pages project create costa-clara --production-branch main
npm run build
npx wrangler pages deploy dist/costa-clara/browser --project-name costa-clara
```

Para automatizarlo en GitHub Actions, añade los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` al repo y un workflow que ejecute el build y `wrangler pages deploy`. No subas tokens al repo.

## Rutas SPA

`public/_redirects` contiene:

```
/*    /index.html   200
```

Angular copia ese fichero a la raíz del build, así que recargar `/?isla=mallorca` o una URL profunda devuelve la app en vez de un 404. No hace falta configurar nada más en Pages.

## Verificación tras el primer deploy

- La home carga por HTTPS y el mapa pinta los marcadores.
- Recargar con `?isla=menorca&calidad=excelente` mantiene los filtros.
- Abrir una URL inexistente muestra la app (pendiente la página 404 propia, ticket CC-06).
- En DevTools → Network, los assets llevan hash y `cache-control` de larga duración.
- El build de Cloudflare termina con el mismo tamaño que en local (~600 kB inicial).

## Notas

- No se necesita backend ni base de datos.
- Si el build falla por Node, confirma `NODE_VERSION=22` en las variables del proyecto.
- El plan gratuito de Pages cubre builds ilimitados en repos públicos y ancho de banda generoso; revisa límites actuales antes de publicar tráfico alto.
