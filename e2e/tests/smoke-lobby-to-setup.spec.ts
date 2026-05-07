import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Lobby to Setup Navigation Smoke Test', () => {
  const GAME_CODE = 'ABCD';

  test('should navigate from lobby to setup successfully', async ({ page, seedPlayerState, mocks }) => {
    await seedPlayerState({
      userId: 1,
      nickname: 'Host',
      isHost: true,
      gameCode: GAME_CODE,
      hostUserId: 1,
    });

    // Mock APIs
    await mocks.categories();
    await mocks.game(GAME_CODE, {
      gameCode: GAME_CODE,
      totalRounds: 5,
      timerDuration: 60,
      selectedCategoryIds: [1],
      players: [
        { userId: 1, nickname: 'Host', isHost: true },
        { userId: 2, nickname: 'Guest', isHost: false },
      ],
      hostUserId: 1,
    });

    await mocks.signalRNegotiate();

    await page.goto(`/lobby/${GAME_CODE}`);

    const configBtn = page.getByRole('button', { name: /Configure Game/i });
    await expect(configBtn).toBeEnabled();
    await configBtn.click();

    await expect(page).toHaveURL(new RegExp(`/setup/${GAME_CODE}`));

    // Wait for elements to be visible or error to appear
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10_000 });
    
    // Explicitly check for setup form or error message
    const setupForm = page.locator('.setup-form');
    const errorMsg = page.locator('.error-msg');
    
    await expect(setupForm.or(errorMsg)).toBeVisible({ timeout: 10_000 });
    
    // If it's a smoke test and we expect success:
    await expect(setupForm).toBeVisible();
  });
});
