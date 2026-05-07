import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Lobby Smoke Test - Host', () => {
  const GAME_CODE = 'ABCD';

  test.beforeEach(async ({ page, seedPlayerState, mocks }) => {
    // 1. Mock Storage/Auth state as Host
    await seedPlayerState({
      userId: 1,
      nickname: 'Host',
      isHost: true,
      gameCode: GAME_CODE,
      selectedCategoryIds: [1],
      totalRounds: 5,
      timerDuration: 60,
      hostUserId: 1,
    });

    // 2. Mock APIs
    await mocks.categories();
    await mocks.game(GAME_CODE, {
      gameCode: GAME_CODE,
      totalRounds: 5,
      timerDuration: 60,
      language: 'en',
      state: 'Lobby',
      players: [
        { userId: 1, nickname: 'Host', isHost: true, isOnline: true, totalScore: 0 },
        { userId: 2, nickname: 'Guest', isHost: false, isOnline: true, totalScore: 0 },
      ],
      selectedCategoryIds: [1],
      hostUserId: 1,
    });

    // Visit the lobby
    await page.goto(`/lobby/${GAME_CODE}`);

    // Wait for mock and initial API load
    await page.waitForFunction(() => !!(window as any).basta_mock_signalr, { timeout: 15_000 });
  });

  test('should show configure game controls for host', async ({ page }) => {
    // 3. Assert Host Controls
    await expect(page).toHaveURL(new RegExp(`/lobby/${GAME_CODE}`));
    await expect(page.locator('[data-cy="lobby-loaded"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.host-controls')).toBeVisible({ timeout: 10_000 });

    const configBtn = page.getByRole('button', { name: /Configure Game/i });
    await expect(configBtn).toBeEnabled();
    await configBtn.click();

    // 4. Assert navigation
    await expect(page).toHaveURL(new RegExp(`/setup/${GAME_CODE}`));
  });
});
