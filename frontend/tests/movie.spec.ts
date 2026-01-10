import { test, expect } from '@playwright/test';

test.describe('Real E2E – Movie Search (Real Backend)', () => {
  test('User search movie and backend returns data', async ({ page }) => {
    // buka frontend
    await page.goto('http://localhost:3000');

    // 1. Trigger search
    await page
      .getByPlaceholder(/search for a movie/i)
      .fill('Inception');

    await page
      .getByRole('button', { name: /search/i })
      .click();

    // 2. Tunggu minimal 1 row muncul
    const rows = page.locator('tbody tr');
    await rows.first().waitFor({ timeout: 60_000 });

    // 3. Validasi ada data
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
