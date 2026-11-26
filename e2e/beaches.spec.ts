import { expect, test } from '@playwright/test';

test('carga la home con mapa, lista y contador', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Encuentra tu playa' })).toBeVisible();
  await expect(page.getByTestId('result-count')).toHaveText('19 playas');
  await expect(page.locator('app-beach-map canvas')).toBeVisible();
});

test('busca por texto y limpia los filtros', async ({ page }) => {
  await page.goto('/');

  const search = page.getByLabel('Buscar playa');
  await search.fill('trenc');

  await expect(page.getByTestId('result-count')).toHaveText('1 playa');
  await expect(page).toHaveURL(/q=trenc/);
  await expect(page.getByRole('button', { name: /^Es Trenc/ })).toBeVisible();

  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();

  await expect(search).toHaveValue('');
  await expect(page.getByTestId('result-count')).toHaveText('19 playas');
  await expect(page).not.toHaveURL(/q=/);
});

test('restaura isla y calidad desde la URL', async ({ page }) => {
  await page.goto('/?isla=menorca&calidad=excelente');

  await expect(page.getByRole('button', { name: /^Menorca \d+$/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Calidad del agua')).toHaveValue('excelente');
  await expect(page.getByTestId('result-count')).toHaveText('2 playas');
  await expect(page.getByRole('button', { name: /^Cala Macarella/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Son Bou/ })).toHaveCount(0);
});

test('abre la ficha, sincroniza la URL y la cierra', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /^Cala Macarella/ }).click();

  const detailTitle = page.getByRole('heading', { level: 2, name: 'Cala Macarella' });
  await expect(detailTitle).toBeVisible();
  await expect(page).toHaveURL(/playa=cala-macarella/);
  await expect(page.getByRole('link', { name: /Cómo llegar/ })).toHaveAttribute(
    'href',
    /google\.com\/maps/,
  );

  await page.getByRole('button', { name: 'Cerrar ficha' }).click();

  await expect(detailTitle).toHaveCount(0);
  await expect(page).not.toHaveURL(/playa=/);
});

test('mantiene el estado compartido al recargar', async ({ page }) => {
  await page.goto('/?isla=formentera&playa=ses-illetes');

  const detailTitle = page.getByRole('heading', { level: 2, name: 'Ses Illetes' });
  await expect(detailTitle).toBeVisible();

  await page.reload();

  await expect(detailTitle).toBeVisible();
  await expect(page.getByRole('button', { name: /^Formentera \d+$/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('muestra el estado vacío y permite limpiar', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Buscar playa').fill('zzzz');

  await expect(page.getByText('No hay playas para «zzzz»')).toBeVisible();

  await page.getByRole('button', { name: 'Limpiar filtros' }).last().click();

  await expect(page.getByTestId('result-count')).toHaveText('19 playas');
});

test('actualiza el título y los metadatos al abrir una playa', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /^Es Trenc/ }).click();

  await expect(page).toHaveTitle('Es Trenc · Costa Clara');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Es Trenc \(Mallorca, Campos\)/,
  );
});

test('muestra la página 404 en rutas desconocidas', async ({ page }) => {
  await page.goto('/ruta/inexistente');

  await expect(page.getByRole('heading', { name: 'Esta playa no está en el mapa' })).toBeVisible();
  await expect(page).toHaveTitle('Página no encontrada · Costa Clara');

  await page.getByRole('link', { name: /Volver al mapa/ }).click();

  await expect(page.getByRole('heading', { name: 'Encuentra tu playa' })).toBeVisible();
});

test('guarda una playa como favorita y la conserva al recargar', async ({ page }) => {
  await page.goto('/');

  const favorite = page.getByTestId('favorite-es-trenc');
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');

  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.getByTestId('favorite-es-trenc')).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /Favoritas \(1\)/ }).click();

  await expect(page.getByTestId('result-count')).toHaveText('1 playa');
  await expect(page.getByRole('button', { name: /^Es Trenc/ })).toBeVisible();
});

test('explica cómo añadir favoritas cuando no hay ninguna', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Favoritas \(0\)/ }).click();

  await expect(page.getByText('Todavía no tienes favoritas')).toBeVisible();

  await page.getByRole('button', { name: 'Ver todas las playas' }).click();

  await expect(page.getByTestId('result-count')).toHaveText('19 playas');
});

test('comparte la ficha copiando un enlace con los filtros', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    } catch {
      // Sin Web Share API se usa el portapapeles.
    }
  });

  await page.goto('/?isla=mallorca');
  await page.getByRole('button', { name: /^Es Trenc/ }).click();
  await page.getByTestId('detail-share').click();

  await expect(page.getByText('Enlace copiado')).toBeVisible();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('isla=mallorca');
  expect(copied).toContain('playa=es-trenc');
});

test('cambia la capa base y la recuerda al recargar', async ({ page }) => {
  await page.goto('/');

  const basemap = page.getByLabel('Capa del mapa');
  await basemap.selectOption('satellite');
  await expect(basemap).toHaveValue('satellite');

  await page.reload();

  await expect(page.getByLabel('Capa del mapa')).toHaveValue('satellite');
});

test('colapsa y expande la leyenda de calidad', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Calidad' });
  const initial = await toggle.getAttribute('aria-expanded');

  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-expanded', initial === 'true' ? 'false' : 'true');

  if (initial === 'true') {
    await expect(page.getByTestId('quality-legend')).toHaveCount(0);
  } else {
    await expect(page.getByTestId('quality-legend')).toBeVisible();
  }

  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-expanded', initial ?? 'true');
});

test('ordena por distancia con la geolocalización y permite cambiar de orden', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 39.57, longitude: 2.65 });

  await page.goto('/');
  await page.getByRole('button', { name: 'Cerca de mí' }).click();

  await expect(page.getByText('Ordenado por distancia a tu ubicación.')).toBeVisible();
  await expect(page.getByTestId('sort-filter')).toHaveValue('distancia');
  await expect(page.getByTestId('distance-es-trenc')).toHaveText(/a .*(km|m)/);

  await page.getByTestId('sort-filter').selectOption('nombre');
  await expect(page.getByText(/Ubicación activa/)).toBeVisible();
  await expect(page.getByTestId('distance-es-trenc')).toHaveText(/a .*(km|m)/);
});

test('muestra el histórico de calidad y la tendencia', async ({ page }) => {
  await page.goto('/?playa=es-trenc');

  const detail = page.locator('app-beach-detail');

  await expect(detail.getByText('Histórico de calidad')).toBeVisible();
  await expect(detail.getByText('↑ Mejora')).toBeVisible();
  await expect(detail.getByRole('img', { name: /Histórico de 5 muestras/ })).toBeVisible();
  await expect(detail.getByText('Datos de demostración')).toBeVisible();
});

test('búsqueda robusta con acentos, sinónimos, debounce y limpieza (CC-24)', async ({ page }) => {
  await page.goto('/');
  const search = page.getByLabel('Buscar playa');

  await page.evaluate(() => {
    (window as unknown as { __replaceCalls: number }).__replaceCalls = 0;
    const original = history.replaceState.bind(history);
    history.replaceState = (...args) => {
      (window as unknown as { __replaceCalls: number }).__replaceCalls += 1;
      return original(...args);
    };
  });

  await search.pressSequentially('formentera', { delay: 10 });
  await expect(page.getByTestId('result-count')).toHaveText('3 playas');
  await expect(page).toHaveURL(/q=formentera/);

  const replaceCalls = await page.evaluate(
    () => (window as unknown as { __replaceCalls: number }).__replaceCalls,
  );
  expect(replaceCalls).toBe(1);

  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(page.getByTestId('result-count')).toHaveText('19 playas');
  await expect(page).not.toHaveURL(/q=/);

  await search.fill('cala dhort');
  await expect(page.getByTestId('result-count')).toHaveText('1 playa');
  await expect(page.getByRole('button', { name: /^Cala d'Hort/ })).toBeVisible();

  await page.getByTestId('clear-search').click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();

  await search.fill('playa de palma');
  await expect(page.getByRole('button', { name: /^Platja de Palma/ })).toBeVisible();
});

test('ordena resultados, sincroniza ?orden= y muestra contadores cross-filter (CC-23)', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByTestId('island-todas')).toHaveText('Todas 19');
  await expect(page.getByTestId('island-menorca')).toHaveText('Menorca 4');

  await page.getByLabel('Calidad del agua').selectOption('excelente');
  await expect(page.getByTestId('island-todas')).toHaveText('Todas 10');
  await expect(page.getByTestId('island-menorca')).toHaveText('Menorca 2');

  await page.getByTestId('island-menorca').click();
  await expect(page.getByTestId('island-mallorca')).toHaveText('Mallorca 4');

  await page.getByTestId('sort-filter').selectOption('muestra');
  await expect(page).toHaveURL(/orden=muestra/);

  await page.reload();
  await expect(page.getByTestId('sort-filter')).toHaveValue('muestra');

  await page.goto('/?orden=distancia');
  await expect(page.getByTestId('sort-filter')).toHaveValue('nombre');
  await expect(page).not.toHaveURL(/orden=/);
});

test('filtra por servicios (AND) y accesibilidad en Más filtros y restaura por URL (CC-25)', async ({
  page,
}) => {
  await page.goto('/');

  const toggle = page.getByTestId('advanced-filters-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('advanced-filters-panel')).toHaveCount(0);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('advanced-filters-panel')).toBeVisible();

  await page.getByTestId('service-aparcamiento').click();
  await page.getByTestId('service-socorrista').click();
  await expect(page).toHaveURL(/servicios=aparcamiento,socorrista/);

  await page.getByTestId('accessibility-adaptada').click();
  await expect(page).toHaveURL(/accesibilidad=adaptada/);
  await expect(page.getByTestId('result-count')).toHaveText('3 playas');

  await page.reload();
  await expect(page.getByTestId('advanced-filters-toggle')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(page.getByTestId('advanced-filters-panel')).toBeVisible();
  await expect(page.getByTestId('service-aparcamiento')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('accessibility-adaptada')).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();
  await expect(page.getByTestId('result-count')).toHaveText('19 playas');
  await expect(page).not.toHaveURL(/servicios=|accesibilidad=/);
});

test('compara 2-3 playas, limita la 4ª, soporta teclado y URL ?comparar= (CC-21)', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');

  await page.getByTestId('compare-es-trenc').click();
  const tray = page.getByTestId('compare-tray');
  await expect(tray).toBeVisible();
  await expect(page.getByTestId('open-compare')).toBeDisabled();
  await expect(page.getByTestId('open-compare')).toHaveText('Añade 1 playa más');

  await page.getByRole('button', { name: /^Cala Macarella/ }).click();
  await page.getByTestId('detail-compare').click();
  await expect(page.getByTestId('compare-cala-macarella')).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/comparar=es-trenc,cala-macarella/);

  await page.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(tray).toBeVisible();
  await expect(page.getByTestId('open-compare')).toBeEnabled();
  await page.getByTestId('compare-ses-illetes').click();
  await expect(page).toHaveURL(/comparar=es-trenc,cala-macarella,ses-illetes/);

  await page.getByTestId('compare-son-bou').click();
  await expect(page.getByTestId('compare-warning')).toHaveText(
    'Máximo 3 playas a la vez. Quita una para añadir otra.',
  );
  await expect(page.getByTestId('compare-son-bou')).toHaveAttribute('aria-pressed', 'false');

  await page.getByTestId('open-compare').click();
  const dialog = page.getByRole('dialog', { name: 'Comparativa de playas' });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('compare-close')).toBeFocused();

  if (isMobile) {
    await expect(page.getByTestId('compare-cards')).toBeVisible();
    await expect(page.getByTestId('compare-table')).toBeHidden();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  } else {
    await expect(page.getByTestId('compare-table')).toBeVisible();
    await expect(page.getByTestId('compare-cards')).toBeHidden();
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('open-compare')).toBeFocused();

  await page.goto('/?comparar=es-trenc,cala-macarella,ses-illetes,son-bou,inexistente');
  await expect(page.getByRole('dialog', { name: 'Comparativa de playas' })).toBeVisible();
  await expect(page).toHaveURL(/comparar=es-trenc,cala-macarella,ses-illetes$/);
});

test('incluye metadatos Open Graph / Twitter y sirve /og-image.png (CC-42)', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://costa-clara-k23.pages.dev/og-image.png',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    'https://costa-clara-k23.pages.dev/og-image.png',
  );

  const response = await page.request.get('/og-image.png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
});

test('muestra el estado del mar si responde y lo oculta sin romper la ficha si falla (CC-27)', async ({
  page,
}) => {
  await page.route('https://marine-api.open-meteo.com/v1/marine**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          time: '2026-11-26T14:30',
          wave_height: 0.75,
          wave_period: 5.2,
          sea_surface_temperature: null,
        },
      }),
    }),
  );

  await page.goto('/?playa=es-trenc');

  const marine = page.getByTestId('marine-weather');
  await expect(marine).toBeVisible();
  await expect(marine.getByRole('heading', { name: 'Estado del mar' })).toBeVisible();
  await expect(marine.getByRole('link', { name: 'Open-Meteo Marine' })).toHaveAttribute(
    'href',
    'https://open-meteo.com/',
  );
  await expect(marine).toContainText('CC BY 4.0');
  await expect(marine).toContainText('—');

  await page.unroute('https://marine-api.open-meteo.com/v1/marine**');
  await page.route('https://marine-api.open-meteo.com/v1/marine**', (route) =>
    route.fulfill({ status: 503, body: '' }),
  );

  await page.getByRole('button', { name: /^Cala Macarella/ }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Cala Macarella' })).toBeVisible();
  await expect(page.getByTestId('marine-weather-loading')).toHaveCount(0);
  await expect(page.getByTestId('marine-weather')).toHaveCount(0);
});

test('emite eventos de analítica sin PII ni texto de búsqueda crudo (CC-43)', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('https://marine-api.open-meteo.com/v1/marine**', (route) =>
    route.fulfill({ status: 503, body: '' }),
  );
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    } catch {
      // Fallback al portapapeles.
    }

    const events: Array<{ event: string; props: Record<string, string | number | boolean> }> = [];
    (window as unknown as { __analyticsEvents: typeof events }).__analyticsEvents = events;
    window.addEventListener('costa-clara:analytics', (event) => {
      const custom = event as CustomEvent<{
        event: string;
        props: Record<string, string | number | boolean>;
      }>;
      events.push(custom.detail);
    });
  });

  await page.goto('/');

  const search = page.getByLabel('Buscar playa');
  await search.fill('trenc');
  await expect(page.getByTestId('result-count')).toHaveText('1 playa');

  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();
  await page.getByTestId('island-menorca').click();
  await page.getByLabel('Calidad del agua').selectOption('excelente');
  await page.getByLabel('Bandera azul').check();
  await page.getByTestId('advanced-filters-toggle').click();
  await page.getByTestId('service-socorrista').click();
  await page.getByTestId('accessibility-adaptada').click();
  await page.getByRole('button', { name: /Favoritas \(0\)/ }).click();
  await page.getByRole('button', { name: 'Ver todas las playas' }).click();
  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();

  await page.getByTestId('favorite-es-trenc').click();
  await page.getByRole('button', { name: /^Es Trenc/ }).click();
  await page.getByTestId('detail-share').click();
  await expect(page.getByText('Enlace copiado')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar ficha' }).click();

  await page.getByTestId('compare-es-trenc').click();
  await page.getByTestId('compare-cala-macarella').click();
  await page.getByTestId('open-compare').click();
  await expect(page.getByRole('dialog', { name: 'Comparativa de playas' })).toBeVisible();

  const events = await page.evaluate(
    () =>
      (
        window as unknown as {
          __analyticsEvents: Array<{
            event: string;
            props: Record<string, string | number | boolean>;
          }>;
        }
      ).__analyticsEvents,
  );

  const searchEvents = events.filter((item) => item.event === 'search');
  expect(searchEvents).toHaveLength(1);
  expect(searchEvents[0].props).toEqual({ queryLength: 5, results: 1 });

  const filterTypes = events
    .filter((item) => item.event === 'filter')
    .map((item) => item.props['type']);
  expect(filterTypes).toEqual(
    expect.arrayContaining([
      'island',
      'quality',
      'blue_flag',
      'service',
      'accessibility',
      'favorites',
    ]),
  );

  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        event: 'beach_open',
        props: { beach: 'es-trenc', island: 'mallorca' },
      }),
      expect.objectContaining({
        event: 'favorite',
        props: { beach: 'es-trenc', active: true },
      }),
      expect.objectContaining({
        event: 'share',
        props: { beach: 'es-trenc', method: 'clipboard' },
      }),
      expect.objectContaining({
        event: 'compare_open',
        props: { count: 2 },
      }),
    ]),
  );

  expect(JSON.stringify(events)).not.toContain('"trenc"');
});
