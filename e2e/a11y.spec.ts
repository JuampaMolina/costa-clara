import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING_IMPACTS = ['critical', 'serious'];

const scenarios = [
  {
    name: 'home',
    path: '/',
    ready: (page: import('@playwright/test').Page) =>
      expect(page.getByRole('heading', { name: 'Encuentra tu playa' })).toBeVisible(),
  },
  {
    name: 'ficha abierta',
    path: '/?playa=es-trenc',
    ready: (page: import('@playwright/test').Page) =>
      expect(page.getByRole('heading', { level: 2, name: 'Es Trenc' })).toBeVisible(),
  },
  {
    name: 'comparador abierto',
    path: '/?comparar=es-trenc,cala-macarella',
    ready: (page: import('@playwright/test').Page) =>
      expect(page.getByRole('dialog', { name: 'Comparativa de playas' })).toBeVisible(),
  },
];

for (const scenario of scenarios) {
  test(`sin violaciones WCAG AA críticas o serias: ${scenario.name}`, async ({ page }) => {
    await page.goto(scenario.path);
    await scenario.ready(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();

    const blocking = results.violations
      .filter((violation) => BLOCKING_IMPACTS.includes(violation.impact ?? ''))
      .map(
        (violation) =>
          `${violation.id} [${violation.impact}] (${violation.nodes.length} nodo/s): ${violation.help}`,
      );

    expect(blocking).toEqual([]);
  });
}
