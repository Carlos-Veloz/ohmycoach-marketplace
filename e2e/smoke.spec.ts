import { expect, test } from '@playwright/test';

const ORIGIN = 'http://localhost:4174';

// Browser locale is English on purpose: the UI must stay in Spanish (D-062).
test.use({ locale: 'en-US' });

test('the home page is in Spanish', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Programas de entrenamiento de los mejores coaches',
  );
});

test('Inter is bundled and the shell only talks to its own origin', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(ORIGIN)) external.push(request.url());
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const fontFamily = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily).toContain('Inter Variable');
  expect(external).toEqual([]);
});

test('an unknown path shows the not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
});
