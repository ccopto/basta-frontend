/**
 * Smoke Test: Dictionary Validation Cascade
 *
 * Verifies that the two-phase validation model works correctly from the
 * frontend perspective:
 *  - Phase 1 (dictionary-valid): answer shows ✅ badge, does NOT appear in peer-review grid
 *  - Phase 2 (peer-review needed): answer appears in the validation grid for voting
 *  - All-auto-validated state: shows the "no peer review needed" notice instead of the table
 */
import { test, expect } from '../fixtures/basta-fixtures';

const GAME_CODE = 'DICT';

test.describe('Dictionary Validation Smoke Test', () => {
  test.beforeEach(async ({ page, seedPlayerState, mocks }) => {
    await seedPlayerState({
      userId: 1,
      nickname: 'Host',
      isHost: true,
      gameCode: GAME_CODE,
    });

    await mocks.categories();
    await mocks.game(GAME_CODE, {
      selectedCategoryIds: [1, 2],
      gameCode: GAME_CODE,
    });
    await mocks.signalRNegotiate();

    await page.goto(`/game/${GAME_CODE}`);
    await page.waitForFunction(() => !!(window as any).basta_mock_signalr, { timeout: 15_000 });
  });

  test('should show peer-review grid when answers require peer review', async ({
    page,
    triggerSignalR,
  }) => {
    // 1. Trigger DisplayScoring with mixed dictionary/peer-review answers
    await triggerSignalR('DisplayScoring', {
      players: [
        {
          userId: 1,
          nickname: 'Host',
          answers: [
            {
              answerId: 1,
              categoryId: 1,
              answer: 'Mango',
              dictionaryValid: false,
              requiresPeerReview: true,  // << fails dict check, needs peer vote
            },
            {
              answerId: 2,
              categoryId: 2,
              answer: 'Meerkat',
              dictionaryValid: true,
              requiresPeerReview: false, // << auto-accepted
            },
          ],
        },
      ],
    });

    // 2. Validation grid should appear
    await expect(page.locator('app-validation-grid')).toBeVisible({ timeout: 10_000 });

    // 3. The peer-review prompt should be shown for category 1 (Mango failed dict)
    const peerPrompts = page.locator('[data-testid="peer-review-prompt"]');
    await expect(peerPrompts.first()).toBeVisible({ timeout: 5_000 });

    // 4. Auto-validated notice should NOT be shown (we still have peer review items)
    await expect(page.locator('.auto-validated-notice')).not.toBeVisible();
  });

  test('should show auto-validated notice when all answers pass dictionary check', async ({
    page,
    triggerSignalR,
  }) => {
    // Trigger DisplayScoring where every answer is auto-accepted
    await triggerSignalR('DisplayScoring', {
      players: [
        {
          userId: 1,
          nickname: 'Host',
          answers: [
            {
              answerId: 10,
              categoryId: 1,
              answer: 'Mango',
              dictionaryValid: true,
              requiresPeerReview: false,
            },
            {
              answerId: 11,
              categoryId: 2,
              answer: 'Meerkat',
              dictionaryValid: true,
              requiresPeerReview: false,
            },
          ],
        },
      ],
    });

    await expect(page.locator('app-validation-grid')).toBeVisible({ timeout: 10_000 });

    // Auto-validated notice should show instead of the table
    await expect(page.locator('.auto-validated-notice')).toBeVisible({ timeout: 5_000 });

    // No peer-review table rendered
    await expect(page.locator('.validation-table')).not.toBeVisible();
  });

  test('should show dictionary-valid badge (✅) in round results', async ({
    page,
    triggerSignalR,
  }) => {
    // Trigger Validation phase first to put the component into the right state
    await triggerSignalR('DisplayScoring', {
      players: [
        {
          userId: 1,
          nickname: 'Host',
          answers: [
            {
              answerId: 1,
              categoryId: 1,
              answer: 'Mango',
              dictionaryValid: true,
              requiresPeerReview: false,
            },
          ],
        },
      ],
    });
    await expect(page.locator('app-validation-grid')).toBeVisible({ timeout: 10_000 });

    // Trigger Results phase with dictionaryValid=true answer
    await triggerSignalR('ReceiveGameScore', [
      {
        userId: 1,
        nickname: 'Host',
        roundScore: 10,
        cumulativeScore: 10,
        answers: [
          {
            categoryId: 1,
            answer: 'Mango',
            isValid: true,
            points: 10,
            isUnique: true,
            dictionaryValid: true,
          },
        ],
      },
    ]);

    await expect(page.locator('app-round-results')).toBeVisible({ timeout: 10_000 });

    // The ✅ badge should be visible for the dictionary-validated answer
    const dictBadge = page.locator('[data-testid="badge-dictionary-valid"]');
    await expect(dictBadge.first()).toBeVisible({ timeout: 5_000 });
  });
});
