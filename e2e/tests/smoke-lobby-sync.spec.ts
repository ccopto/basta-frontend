import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Lobby Smoke Test - Sync', () => {
  const GAME_CODE = 'ABCD';

  test.beforeEach(async ({ page, seedPlayerState, mocks }) => {
    // 1. Mock Storage/Auth state as Host already in lobby
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
    // Initial load: Only the host is in the lobby
    await mocks.game(GAME_CODE, {
      gameCode: GAME_CODE,
      totalRounds: 5,
      timerDuration: 60,
      language: 'en',
      state: 'Lobby',
      players: [
        { userId: 1, nickname: 'Host', isHost: true, isOnline: true, totalScore: 0 },
      ],
      selectedCategoryIds: [1],
      hostUserId: 1,
    });

    // Visit the lobby
    await page.goto(`/lobby/${GAME_CODE}`);

    // Wait for the SignalR mock to be available in the window
    await page.waitForFunction(() => !!(window as any).basta_mock_signalr, { timeout: 15_000 });
  });

  test('should update the UI when a guest joins via SignalR', async ({
    page,
    triggerSignalR,
  }) => {
    // Verify Lobby is loaded with just the Host
    await expect(page).toHaveURL(new RegExp(`/lobby/${GAME_CODE}`));
    await expect(page.locator('[data-cy="lobby-loaded"]')).toBeVisible({ timeout: 15_000 });

    // Assert only Host is present initially
    await expect(page.locator('[data-cy="player-item"]')).toHaveCount(1);
    await expect(page.locator('[data-cy="player-item"]').first()).toContainText('Host');

    // Guest joins in another browser, server broadcasts ReceiveLobbyUpdate
    const updatedLobbyPayload = {
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
    };

    // Trigger SignalR event
    await triggerSignalR('ReceiveLobbyUpdate', updatedLobbyPayload);

    // Assert that the UI updates reactively
    await expect(page.locator('[data-cy="player-item"]')).toHaveCount(2, { timeout: 10_000 });
    await expect(page.locator('[data-cy="player-item"]').nth(1)).toContainText('Guest');
  });
});
