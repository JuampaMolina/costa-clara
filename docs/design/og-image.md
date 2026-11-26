# Especificación de imagen Open Graph (`CC-42`)

> **Master vectorial:** [`docs/design/og-image.svg`](./og-image.svg)
> **Salida esperada en app:** `public/og-image.png` (1200×630 px, PNG optimizado)
> **Restricciones:** 100 % vectorial propio (sin fotografías externas, sin fuentes web externas, sin problemas de licencias).

---

## 1. Formato, dimensiones y zona segura

| Propiedad | Especificación |
| --- | --- |
| **Lienzo total** | `1200 × 630 px` (relación `1.905:1`, estándar Open Graph y `summary_large_image` en X/Twitter) |
| **Margen de seguridad exterior** | `80 px` en los 4 lados → **zona segura activa `1040 × 470 px`** (`x: 80..1120`, `y: 80..550`) |
| **Protección contra recortes** | Todo texto, isotipo, píldoras y la tarjeta cartográfica viven íntegramente dentro de `80..1120 × 80..550`, resistiendo esquinas redondeadas y recortes `16:9` / `1.91:1` de WhatsApp, Telegram, LinkedIn, Slack, Discord y X. |
| **Tipografía** | Pila de sistema idéntica a `src/styles.css` (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) para garantizar rasterizado determinista en cualquier entorno sin descargar fuentes. |
| **Sin fotos externas** | Solo primitivas SVG nativas (`rect`, `path`, `circle`, `linearGradient`, `radialGradient`). Ningún `<image>` ni URL remota. |

---

## 2. Identidad de marca y composición

- **Isotipo:** reproduce el emblema de `beaches-page.html` (cuadrado redondeado `#0284c7` con las dos olas y flecha superior en trazo blanco).
- **Paleta:** alineada con `@theme` de `src/styles.css` (`sea-900` `#0c4a6e`, `sea-800` `#075985`, `sea-700` `#0369a1`, `sea-600` `#0284c7`, `sea-300` `#7dd3fc`, `sea-200` `#bae6fd`, `sea-100` `#e0f2fe`) y los colores de calidad de `src/app/core/models/beach.ts` (`#0f9f6e`, `#65a30d`, `#d97706`).
- **Jerarquía en dos columnas:**
  - **Izquierda (`x: 80..660`):** isotipo + marca «Costa Clara · Observatorio de playas · Baleares», titular en dos líneas (`56 px`), subtítulo (`23 px`), tres píldoras de propuesta de valor y cierre con las cuatro islas (`Mallorca · Menorca · Ibiza · Formentera`).
  - **Derecha (`x: 704..1120`):** tarjeta cartográfica luminosa con siluetas esquemáticas de Mallorca, Menorca, Ibiza y Formentera, marcadores de calidad del agua, un marcador agrupado (`19`) y leyenda flotante inferior (`Excelente · Buena · Suficiente · Azul`), comunicando el producto incluso en miniaturas de 300 px.
- **Honestidad de datos:** no muestra cifras ni porcentajes inventados de calidad oficial; el `19` refleja el clúster visual del mapa actual sin atribuir procedencia oficial inexistente.

---

## 3. Verificación de contraste (WCAG 2.1 AA)

Todos los pares de texto y elementos gráficos superan el umbral WCAG AA (`≥ 4.5:1` texto normal, `≥ 3.0:1` texto grande / gráficos UI):

| Elemento | Primer plano | Fondo | Ratio | Nivel |
| --- | --- | --- | --- | --- |
| Marca y titular línea 1 | `#ffffff` | `#082f49` / `#0c4a6e` | `13.88:1` / `9.46:1` | AAA |
| Titular línea 2 (`56 px`) | `#7dd3fc` | `#082f49` / `#0c4a6e` | `8.32:1` / `5.67:1` | AA / AAA |
| Subtítulo (`23 px`) | `#e0f2fe` | `#0c4a6e` | `8.24:1` | AAA |
| Submarca y pie de islas | `#bae6fd` | `#082f49` / `#0c4a6e` | `10.46:1` / `7.13:1` | AAA |
| Texto en píldoras inferiores | `#f8fafc` | `#082f49` | `13.26:1` | AAA |
| Clúster numérico (`19`) | `#ffffff` | `#0369a1` | `5.93:1` | AA |
| Etiquetas y título en tarjeta mapa | `#0f172a` | `#ffffff` | `17.85:1` | AAA |
| Texto de leyenda en tarjeta mapa | `#334155` | `#ffffff` | `10.35:1` | AAA |
| Pill «Azul» en leyenda | `#0369a1` | `#f0f9ff` | `5.57:1` | AA |
| Puntos de calidad (UI no texto) | `#0f9f6e` / `#65a30d` / `#d97706` | `#ffffff` | `3.38:1` / `3.09:1` / `3.19:1` | AA (1.4.11) |

---

## 4. Handoff a Forge para generar el PNG e integrarlo (`CC-42`)

### Exportación a `public/og-image.png`
Playwright (ya instalado en `devDependencies`) puede rasterizar el SVG a `1200×630` sin añadir dependencias nuevas, por ejemplo con un pequeño script en `scripts/` (o comando puntual) que cargue `docs/design/og-image.svg` en un viewport `1200×630` (`deviceScaleFactor: 1`) y guarde `public/og-image.png`.

- Peso objetivo del PNG: **≤ 150 kB** (la captura cruda de Chromium con degradados ronda ~440 kB; optimizar con `oxipng`/`pngquant`/`sharp` si se quiere reducir, aunque sigue muy por debajo del límite de 5 MB de Open Graph).
- Verificar visualmente que no hay texto cortado ni solapamientos tras rasterizar.

### Metadatos en `src/index.html`
Añadir (y actualizar `twitter:card` a `summary_large_image` en `src/index.html:20`):

```html
<meta property="og:image" content="https://costa-clara-k23.pages.dev/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta
  property="og:image:alt"
  content="Costa Clara: mapa interactivo de las playas de Baleares con calidad del agua, servicios y bandera azul."
/>
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://costa-clara-k23.pages.dev/og-image.png" />
```

### Archivos para Forge
- **Tocar:** `public/og-image.png` (generado desde `docs/design/og-image.svg`), `src/index.html`, y opcionalmente `scripts/render-og.mjs` (si se quiere regeneración reproducible en `package.json`).
- **No tocar:** `docs/design/og-image.svg` (salvo ajustes visuales acordados), `src/app/features/beaches/*`, `src/styles.css`.
