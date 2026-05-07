import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Lobby Smoke Test - Guest', () => {
  const GAME_CODE = 'ABCD';

  test.beforeEach(async ({ page, seedPlayerState, mocks }) => {
    // 1. Mock Storage/Auth state as a Guest
    await seedPlayerState({
      userId: 2,
      nickname: 'Guest',
      isHost: false,
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

  test('should display waiting indicator and navigate on GameStarted', async ({
    page,
    triggerSignalR,
  }) => {
    // 3. Verify Lobby is visible and loaded
    await expect(page).toHaveURL(new RegExp(`/lobby/${GAME_CODE}`));
    await expect(page.locator('[data-cy="lobby-loaded"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.waiting-indicator')).toBeVisible({ timeout: 10_000 });

    // 4. Trigger SignalR event manually
    await triggerSignalR('GameStarted', {});

    // 5. Assert navigation
    await expect(page).toHaveURL(new RegExp(`/game/${GAME_CODE}`));
  });
});
