import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Smoke Navigation', () => {
  test('should load the home page and have the title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Basta')).toBeVisible();
    await expect(page.getByText('Online')).toBeVisible();
  });

  test('should redirect to home if entering game page without session', async ({ page }) => {
    await page.goto('/game/ABCD');
    await expect(page).toHaveURL(/\/home/);
  });
});
