import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Setup Smoke Test', () => {
  const GAME_CODE = 'ABCD';

  test('should load the setup page and show categories', async ({ page, seedPlayerState, mocks }) => {
    await seedPlayerState({
      userId: 1,
      nickname: 'Host',
      isHost: true,
      gameCode: GAME_CODE,
    });

    // Mock API endpoints
    await mocks.categories([
      { categoryId: 1, name: 'Fruits' },
      { categoryId: 2, name: 'Animals' },
    ]);
    
    await mocks.game(GAME_CODE, {
      gameCode: GAME_CODE,
      totalRounds: 5,
      timerDuration: 60,
      selectedCategoryIds: [1],
      players: [{ userId: 1, nickname: 'Host', isHost: true }]
    });

    // Mock SignalR negotiation
    await mocks.signalRNegotiate();

    await page.goto(`/setup/${GAME_CODE}`);

    // Wait for the data to load
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10_000 });
    
    // Assert form is visible
    const setupForm = page.locator('.setup-form');
    
    // Success path assertion
    await expect(setupForm).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.cat-name').first()).toContainText('Fruits');
  });
});
