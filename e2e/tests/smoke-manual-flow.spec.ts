import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Manual Flow Smoke Test', () => {
  test('should allow host to configure after guest joins', async ({ page, mocks, triggerSignalR }) => {
    const gameCode = 'ABCD';
    
    // 1. Mock API calls
    await mocks.createGame(gameCode);
    await mocks.game(gameCode, {
      gameCode: gameCode,
      totalRounds: 5,
      timerDuration: 60,
      language: 'en',
      state: 'Lobby',
      players: [{ userId: 1, nickname: 'Host', isHost: true, isOnline: true, totalScore: 0 }],
      selectedCategoryIds: [1],
      hostUserId: 1
    });
    await mocks.categories();

    // 2. Visit Home
    await page.goto('/home');
    await page.locator('input[formControlName="nickname"]').fill('Host');
    
    const responsePromise = page.waitForResponse('**/api/games');
    await page.getByRole('button', { name: /Create Game/i }).click();
    await responsePromise;
    
    // Host is in Lobby
    await expect(page).toHaveURL(new RegExp(`/lobby/${gameCode}`));
    
    // Initial state: only host, button disabled
    const configBtn = page.getByRole('button', { name: /Configure Game/i });
    await expect(configBtn).toBeDisabled();
    
    // Simulate guest joining via SignalR
    await triggerSignalR('ReceiveLobbyUpdate', {
        gameCode: gameCode,
        totalRounds: 5,
        timerDuration: 60,
        language: 'en',
        state: 'Lobby',
        players: [
            { userId: 1, nickname: 'Host', isHost: true, isOnline: true, totalScore: 0 },
            { userId: 2, nickname: 'Guest', isHost: false, isOnline: true, totalScore: 0 }
        ],
        selectedCategoryIds: [1],
        hostUserId: 1
    });
    
    // Button should enable after guest joins
    await expect(configBtn).toBeEnabled({ timeout: 10_000 });
    await configBtn.click();
    
    // Navigate to setup
    await expect(page).toHaveURL(new RegExp(`/setup/${gameCode}`));
    
    // Setup form should be visible
    await expect(page.locator('.setup-form')).toBeVisible({ timeout: 10_000 });
  });
});
