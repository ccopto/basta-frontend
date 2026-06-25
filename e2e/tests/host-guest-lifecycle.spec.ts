import { test, expect } from '../fixtures/basta-fixtures';

test.describe('SignalR Lifecycle Race Conditions', () => {
  const GAME_CODE = 'BUGG';

  test('Host should navigate to game upon GameStarted after leaving lobby', async ({ page, seedPlayerState, mocks, triggerSignalR }) => {
    // 1. Mock Host in Lobby
    await seedPlayerState({
      userId: 1,
      nickname: 'Host',
      isHost: true,
      gameCode: GAME_CODE,
    });
    await mocks.categories();
    await mocks.game(GAME_CODE, {
      hostUserId: 1,
      players: [
        { userId: 1, nickname: 'Host', score: 0, isHost: true, isOnline: true },
        { userId: 2, nickname: 'Guest', score: 0, isHost: false, isOnline: true }
      ],
    });
    await mocks.signalRNegotiate();

    // 2. Go to Lobby
    await page.goto(`/lobby/${GAME_CODE}`);
    await page.waitForFunction(() => !!(window as any).basta_mock_signalr);

    // 3. Navigate to Setup (this destroys LobbyComponent)
    await page.getByRole('button', { name: 'Configure Game' }).click();
    await expect(page).toHaveURL(`/setup/${GAME_CODE}`);

    // 4. Fire GameStarted (Simulating backend broadcast after host clicks Start Game)
    // In the buggy code, LobbyComponent.ngOnDestroy removed the listener, 
    // so this event will be ignored and the page won't navigate.
    await triggerSignalR('GameStarted', null);

    // 5. Assert navigation
    // We expect the app to navigate to the game page.
    // If the bug is present, this assertion will fail.
    await expect(page).toHaveURL(`/game/${GAME_CODE}`, { timeout: 3000 });
  });

  test('Guest should not miss RoundStarted if it arrives during navigation', async ({ page, seedPlayerState, mocks, triggerSignalR }) => {
    // 1. Mock Guest in Lobby
    await seedPlayerState({
      userId: 2,
      nickname: 'Guest',
      isHost: false,
      gameCode: GAME_CODE,
    });
    await mocks.categories();
    await mocks.game(GAME_CODE, {
      hostUserId: 1,
      selectedCategoryIds: [1, 2],
      players: [
        { userId: 1, nickname: 'Host', score: 0, isHost: true, isOnline: true },
        { userId: 2, nickname: 'Guest', score: 0, isHost: false, isOnline: true }
      ],
    });
    await mocks.signalRNegotiate();

    // 2. Go to Lobby
    await page.goto(`/lobby/${GAME_CODE}`);
    await page.waitForFunction(() => !!(window as any).basta_mock_signalr);

    // 3. Fire GameStarted AND IMMEDIATELY fire RoundStarted.
    // This simulates the backend sending both events back-to-back.
    // The Guest will start navigating on GameStarted, but RoundStarted will arrive BEFORE navigation completes.
    await triggerSignalR('GameStarted', null);
    await triggerSignalR('RoundStarted', {
      roundNumber: 1,
      letter: 'Z',
      timerDuration: 60,
      serverTime: new Date().toISOString()
    });

    // 4. Wait for navigation to finish
    await expect(page).toHaveURL(`/game/${GAME_CODE}`, { timeout: 3000 });

    // 5. Assert that the Guest received the RoundStarted data.
    // If the bug is present, the letter won't be Z, and inputs won't be enabled.
    await expect(page.locator('app-letter-display')).toContainText('Z', { timeout: 3000 });
    const input = page.locator('input').first();
    await expect(input).toBeEnabled();
  });
});
