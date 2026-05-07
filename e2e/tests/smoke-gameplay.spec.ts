import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Gameplay Smoke Test', () => {
  const GAME_CODE = 'ABCD';

  test.beforeEach(async ({ page, seedPlayerState, mocks }) => {
    // 1. Mock Storage/Auth state
    await seedPlayerState({
      userId: 1,
      nickname: 'Host',
      isHost: true,
      gameCode: GAME_CODE,
    });

    // 2. Mock API endpoints
    await mocks.categories();
    await mocks.game(GAME_CODE, {
      selectedCategoryIds: [1],
      gameCode: GAME_CODE,
    });

    // 3. Navigate and wait for init
    await page.goto(`/game/${GAME_CODE}`);

    // Wait for the SignalR mock to be available
    await page.waitForFunction(() => !!(window as any).basta_mock_signalr, { timeout: 15_000 });
  });

  test('should start a round, show letter, and disable inputs on Basta call', async ({
    page,
    triggerSignalR,
  }) => {
    // 4. Trigger Start Round
    await triggerSignalR('RoundStarted', {
      roundNumber: 1,
      letter: 'M',
      timerDuration: 60,
      serverTime: new Date().toISOString(),
    });

    // 5. Assert UI state
    await expect(page.locator('app-letter-display')).toContainText('M', { timeout: 10_000 });
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    await input.fill('Mango');

    // 6. Trigger Basta!
    await triggerSignalR('RoundStopped', { callerNickname: 'Host' });
    await expect(input).toBeDisabled();
  });
});
