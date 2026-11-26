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

  await expect(page.getByRole('button', { name: 'Menorca', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
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
    /google\.com\/maps/
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
  await expect(page.getByRole('button', { name: 'Formentera', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('muestra el estado vacío y permite limpiar', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Buscar playa').fill('zzzz');

  await expect(page.getByText('No hay playas con esos filtros')).toBeVisible();

  await page.getByRole('button', { name: 'Limpiar filtros' }).last().click();

  await expect(page.getByTestId('result-count')).toHaveText('19 playas');
});

test('actualiza el título y los metadatos al abrir una playa', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /^Es Trenc/ }).click();

  await expect(page).toHaveTitle('Es Trenc · Costa Clara');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Es Trenc \(Mallorca, Campos\)/
  );
});

test('muestra la página 404 en rutas desconocidas', async ({ page }) => {
  await page.goto('/ruta/inexistente');

  await expect(
    page.getByRole('heading', { name: 'Esta playa no está en el mapa' })
  ).toBeVisible();
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

test('ordena por distancia con la geolocalización', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 39.57, longitude: 2.65 });

  await page.goto('/');
  await page.getByRole('button', { name: 'Cerca de mí' }).click();

  await expect(page.getByText('Ordenado por distancia a tu ubicación.')).toBeVisible();
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
