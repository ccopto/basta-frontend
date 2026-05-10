import { test, expect } from '@playwright/test';

test.describe('Internationalization Smoke Test', () => {
  test('should switch language on the home page', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('/');

    // 2. Verify default English text
    await expect(page.locator('.form-title')).toHaveText('Start Playing');
    await expect(page.locator('label[for="nickname"]')).toHaveText('Choose a Nickname');

    // 3. Change language to Spanish
    await page.selectOption('select#language', 'es');

    // 4. Verify text changes to Spanish
    // (Note: These values must match the ones in our es.json later)
    await expect(page.locator('.form-title')).toHaveText('Comenzar a Jugar');
    await expect(page.locator('label[for="nickname"]')).toHaveText('Elige un Apodo');

    // 5. Change back to English
    await page.selectOption('select#language', 'en');
    await expect(page.locator('.form-title')).toHaveText('Start Playing');
  });
});
