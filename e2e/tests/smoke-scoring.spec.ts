import { test, expect } from '../fixtures/basta-fixtures';

test.describe('Scoring Smoke Test', () => {
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
  });

  test('should display validation and results phases', async ({
    page,
    triggerSignalR,
  }) => {
    // 4. Trigger Validation Phase
    await triggerSignalR('DisplayScoring', {
      players: [
        {
          userId: 1,
          nickname: 'Host',
          answers: { 1: 'Mango' },
        },
      ],
    });

    // 5. Assert Validation UI
    await expect(page.locator('app-validation-grid')).toBeVisible({ timeout: 10_000 });

    // 6. Trigger Results Phase
    await triggerSignalR('ReceiveGameScore', [
      {
        userId: 1,
        nickname: 'Host',
        roundScore: 10,
        cumulativeScore: 10,
        answers: [],
      },
    ]);

    // 7. Assert Results UI
    await expect(page.locator('app-round-results')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('10')).toBeVisible();
  });
});
