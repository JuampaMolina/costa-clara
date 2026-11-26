import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, type Page } from '@playwright/test';

/**
 * Captura las imágenes del caso de estudio (CC-54): home y ficha a 1440 px y
 * 390 px, en `docs/capturas/`.
 *
 * Requiere el dev server corriendo (por defecto http://localhost:4200).
 * Las APIs de marine/forecast se interceptan para que la captura sea
 * determinista y no dependa de la red ni muestre datos personales.
 */

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'docs/capturas');
const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:4200';

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

async function blockWeatherApis(page: Page): Promise<void> {
  await page.route('https://marine-api.open-meteo.com/v1/marine**', (route) =>
    route.fulfill({ status: 503, body: '' }),
  );
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) =>
    route.fulfill({ status: 503, body: '' }),
  );
}

async function waitForHome(page: Page): Promise<void> {
  await page.getByRole('heading', { name: 'Encuentra tu playa' }).waitFor();
  await page.locator('app-beach-map canvas').waitFor();
  await page.waitForTimeout(1500);
}

async function waitForFicha(page: Page): Promise<void> {
  await page.getByRole('heading', { level: 2, name: 'Es Trenc' }).waitFor();
  await page.waitForTimeout(500);
}

async function run(): Promise<void> {
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    await blockWeatherApis(page);

    await page.goto(baseUrl, { waitUntil: 'load' });
    await waitForHome(page);
    await page.screenshot({ path: resolve(outDir, `home-${viewport.name}.png`) });
    console.log(`✓ home-${viewport.name}.png`);

    await page.goto(`${baseUrl}/?playa=es-trenc`, { waitUntil: 'load' });
    await waitForFicha(page);
    await page.screenshot({ path: resolve(outDir, `ficha-${viewport.name}.png`) });
    console.log(`✓ ficha-${viewport.name}.png`);

    await context.close();
  }

  await browser.close();
  console.log(`\nCapturas guardadas en ${outDir}`);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
