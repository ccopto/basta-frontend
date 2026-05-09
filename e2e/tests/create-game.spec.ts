import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Create Game (US-01 / US-03)', () => {
  test('should render landing page correctly', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: /Basta/i })).toBeVisible();
    await expect(page.getByText('Choose a Nickname')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Game' })).toBeDisabled();
  });

  test('should show validation errors for empty nickname', async ({ page }) => {
    await page.goto('/home');
    await page.locator('input[formControlName="nickname"]').fill('   ');
    await page.locator('input[formControlName="nickname"]').blur();
    await expect(page.locator('[data-cy="nickname-error"]')).toContainText('Nickname is required');
    await expect(page.getByRole('button', { name: 'Create Game' })).toBeDisabled();
  });

  test('should successfully create a game and navigate', async ({ page, mocks }) => {
    const gameCode = 'PLAYWRIGHT';
    await mocks.createGame(gameCode);

    await page.addInitScript(() => sessionStorage.clear());
    await page.goto('/home');
    await page.locator('input[formControlName="nickname"]').fill('PlaywrightUser');

    const responsePromise = page.waitForResponse('**/api/games');
    await page.getByRole('button', { name: 'Create Game' }).click();
    const response = await responsePromise;

    const requestBody = JSON.parse((await response.request().postData()) ?? '{}');
    expect(requestBody).toMatchObject({
      hostNickname: 'PlaywrightUser',
      preferredLanguage: 'en',
    });

    await expect(page).toHaveURL(new RegExp(`/lobby/${gameCode}`));

    const stateJson = await page.evaluate(() =>
      sessionStorage.getItem('basta_player_state')
    );
    const state = JSON.parse(stateJson!);
    expect(state.nickname).toBe('PlaywrightUser');
    expect(state.isHost).toBe(true);
    expect(state.gameCode).toBe(gameCode);
  });
});
