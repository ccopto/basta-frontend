import { expect, Page, test } from '@playwright/test';

type BrowserHealth = {
  errors: string[];
  webSockets: string[];
};

function monitorBrowserHealth(page: Page, label: string): BrowserHealth {
  const health: BrowserHealth = { errors: [], webSockets: [] };

  page.on('pageerror', error => {
    health.errors.push(`${label} pageerror: ${error.message}`);
  });

  page.on('console', message => {
    if (message.type() === 'error') {
      health.errors.push(`${label} console: ${message.text()}`);
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/hubs/')) {
      health.errors.push(
        `${label} request failed: ${request.method()} ${url} (${request.failure()?.errorText ?? 'unknown'})`
      );
    }
  });

  page.on('response', response => {
    if (response.status() >= 500) {
      health.errors.push(
        `${label} HTTP ${response.status()}: ${response.request().method()} ${response.url()}`
      );
    }
  });

  page.on('websocket', socket => {
    health.webSockets.push(socket.url());
  });

  return health;
}

async function setStepperValue(
  page: Page,
  valueTestId: string,
  decrementTestId: string,
  target: number,
  decrementAmount: number
) {
  const value = page.getByTestId(valueTestId);
  const decrement = page.getByTestId(decrementTestId);
  let current = Number((await value.textContent())?.trim());

  while (current !== target) {
    expect(current).toBeGreaterThan(target);
    const next = current - decrementAmount;
    expect(next).toBeGreaterThanOrEqual(target);
    await decrement.click();
    await expect(value).toHaveText(String(next));
    current = next;
  }
}

async function expectRoundReady(page: Page, round: number): Promise<string> {
  await expect(page.getByTestId('game-round-number')).toHaveText(String(round));

  const letter = page.getByTestId('game-letter');
  await expect(letter).toHaveText(/^[A-Z]$/);

  const input = page.getByTestId('game-answer');
  await expect(input).toHaveCount(1);
  await expect(input).toBeEnabled();
  await expect(page.getByTestId('game-basta')).toBeEnabled();
  await expect(page.getByTestId('game-timer')).not.toHaveText('00:00');
  await expect(page.locator('.letter-overlay')).toHaveCount(0);

  return (await letter.textContent())!.trim();
}

async function expectScores(
  page: Page,
  expectedRoundScore: number,
  expectedCumulativeScore: number
) {
  await expect(page.getByTestId('result-player')).toHaveCount(2);

  for (const nickname of ['SmokeHost', 'SmokeGuest']) {
    const card = page.getByTestId('result-player').filter({ hasText: nickname });
    await expect(card).toHaveCount(1);
    await expect(card.getByTestId('result-round-score')).toHaveText(`+${expectedRoundScore} pts`);
    await expect(card.getByTestId('result-cumulative-score')).toContainText(
      String(expectedCumulativeScore)
    );
  }
}

async function completeValidation(page: Page) {
  await expect(page.getByTestId('validation-player')).toHaveCount(2);
  await expect(page.getByTestId('validation-confirm')).toBeEnabled();
}

async function submitBothValidations(hostPage: Page, guestPage: Page) {
  await hostPage.getByTestId('validation-confirm').click();
  await expect(hostPage.getByTestId('validation-confirm')).toBeDisabled();
  await guestPage.getByTestId('validation-confirm').click();
}

test.describe('Live full-game smoke', () => {
  test('two players complete two rounds and reach a tied leaderboard', async ({ browser }) => {
    const milestone = (message: string) => console.log(`[full-game] ${message}`);
    const hostContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const guestContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const hostHealth = monitorBrowserHealth(hostPage, 'host');
    const guestHealth = monitorBrowserHealth(guestPage, 'guest');

    try {
      await hostPage.goto('/');
      await hostPage.getByTestId('home-create-nickname').fill('SmokeHost');
      await hostPage.getByTestId('home-create-game').click();
      await expect(hostPage).toHaveURL(/\/lobby\/[A-Z0-9]{4}$/);

      const gameCode = hostPage.url().match(/\/lobby\/([A-Z0-9]{4})$/)?.[1];
      expect(gameCode, 'generated game code').toBeTruthy();

      await expect(hostPage.getByTestId('lobby-game-code')).toHaveText(gameCode!);
      await expect(hostPage.getByTestId('lobby-player')).toHaveCount(1);
      await expect(hostPage.getByTestId('lobby-player')).toContainText('SmokeHost');

      await guestPage.goto('/');
      await guestPage.getByTestId('home-open-join').click();
      await guestPage.getByTestId('home-join-nickname').fill('SmokeGuest');
      await guestPage.getByTestId('home-join-code').fill(gameCode!);
      await guestPage.getByTestId('home-join-game').click();
      await expect(guestPage).toHaveURL(new RegExp(`/lobby/${gameCode}$`));

      await expect(hostPage.getByTestId('lobby-player')).toHaveCount(2);
      await expect(guestPage.getByTestId('lobby-player')).toHaveCount(2);
      for (const page of [hostPage, guestPage]) {
        await expect(page.getByTestId('lobby-player').filter({ hasText: 'SmokeHost' })).toHaveCount(1);
        await expect(page.getByTestId('lobby-player').filter({ hasText: 'SmokeGuest' })).toHaveCount(1);
      }
      milestone('both players synchronized in lobby');

      await expect(hostPage.getByTestId('lobby-configure')).toBeEnabled();
      await expect(guestPage.getByTestId('lobby-configure')).toHaveCount(0);
      await hostPage.getByTestId('lobby-configure').click();
      await expect(hostPage).toHaveURL(new RegExp(`/setup/${gameCode}$`));

      await setStepperValue(hostPage, 'setup-round-count', 'setup-round-decrement', 2, 1);
      await setStepperValue(hostPage, 'setup-timer-value', 'setup-timer-decrement', 30, 15);

      const category = hostPage.getByTestId('setup-category').first();
      await expect(category).toBeVisible();
      await category.click();
      await expect(category).toHaveClass(/selected/);

      await hostPage.getByTestId('setup-start-game').click();
      await Promise.all([
        expect(hostPage).toHaveURL(new RegExp(`/game/${gameCode}$`)),
        expect(guestPage).toHaveURL(new RegExp(`/game/${gameCode}$`)),
      ]);
      milestone('both players entered round 1');

      const hostRoundOneLetter = await expectRoundReady(hostPage, 1);
      milestone('host round 1 controls ready');
      const guestRoundOneLetter = await expectRoundReady(guestPage, 1);
      milestone('guest round 1 controls ready');
      expect(guestRoundOneLetter).toBe(hostRoundOneLetter);

      const sharedAnswer = `${hostRoundOneLetter}smokeshared`;
      await hostPage.getByTestId('game-answer').fill(sharedAnswer);
      await guestPage.getByTestId('game-answer').fill(sharedAnswer);
      milestone('round 1 answers filled');
      await guestPage.getByTestId('game-basta').evaluate((button: HTMLButtonElement) => button.click());
      milestone('round 1 Basta submitted');

      await expect(hostPage.getByTestId('game-answer')).toHaveCount(0);
      await expect(guestPage.getByTestId('game-answer')).toHaveCount(0);
      milestone('round 1 answer grids left playing phase');
      await completeValidation(hostPage);
      milestone('host round 1 validation ready');
      await completeValidation(guestPage);
      milestone('guest round 1 validation ready');

      await submitBothValidations(hostPage, guestPage);
      milestone('round 1 validations submitted');

      await expectScores(hostPage, 5, 5);
      await expectScores(guestPage, 5, 5);
      await expect(hostPage.getByTestId('result-continue')).toBeEnabled();
      await expect(guestPage.getByTestId('result-continue')).toHaveCount(0);
      milestone('round 1 scores verified');

      await hostPage.getByTestId('result-continue').click();
      const hostRoundTwoLetter = await expectRoundReady(hostPage, 2);
      const guestRoundTwoLetter = await expectRoundReady(guestPage, 2);
      expect(guestRoundTwoLetter).toBe(hostRoundTwoLetter);
      expect(hostRoundTwoLetter).not.toBe(hostRoundOneLetter);
      await expect(hostPage.getByTestId('game-answer')).toHaveValue('');
      await expect(guestPage.getByTestId('game-answer')).toHaveValue('');
      milestone('both players entered round 2');

      const hostUniqueAnswer = `${hostRoundTwoLetter}smokehost`;
      const guestUniqueAnswer = `${hostRoundTwoLetter}smokeguest`;
      await hostPage.getByTestId('game-answer').fill(hostUniqueAnswer);
      await guestPage.getByTestId('game-answer').fill(guestUniqueAnswer);
      await guestPage.getByTestId('game-basta').evaluate((button: HTMLButtonElement) => button.click());
      milestone('round 2 Basta submitted');

      await completeValidation(hostPage);
      await completeValidation(guestPage);
      await submitBothValidations(hostPage, guestPage);
      milestone('round 2 validations submitted');

      await expectScores(hostPage, 10, 15);
      await expectScores(guestPage, 10, 15);
      milestone('round 2 scores verified');

      await hostPage.getByTestId('result-continue').click();
      await Promise.all([
        expect(hostPage).toHaveURL(new RegExp(`/game-over/${gameCode}$`)),
        expect(guestPage).toHaveURL(new RegExp(`/game-over/${gameCode}$`)),
      ]);
      milestone('both players reached game over');

      for (const page of [hostPage, guestPage]) {
        await expect(page.getByTestId('game-over-reason')).toContainText('All rounds completed');
        await expect(page.getByTestId('leaderboard-player')).toHaveCount(2);

        for (const nickname of ['SmokeHost', 'SmokeGuest']) {
          const player = page.getByTestId('leaderboard-player').filter({ hasText: nickname });
          await expect(player).toHaveCount(1);
          await expect(player.getByTestId('leaderboard-score')).toHaveText('15 pts');
          await expect(player.locator('xpath=..').getByTestId('leaderboard-rank')).toHaveText(/#?1/);
        }
      }

      expect(hostHealth.webSockets.some(url => url.includes('/hubs/basta'))).toBe(true);
      expect(guestHealth.webSockets.some(url => url.includes('/hubs/basta'))).toBe(true);
      expect(hostHealth.errors, hostHealth.errors.join('\n')).toEqual([]);
      expect(guestHealth.errors, guestHealth.errors.join('\n')).toEqual([]);
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});
