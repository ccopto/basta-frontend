import { test, expect } from '@playwright/test';

test.describe('Bug-02: Live Integration/Reproduction Test', () => {
  // Target Nginx proxy serving live containers and ignore self-signed SSL errors
  test.use({ 
    baseURL: 'https://localhost',
    ignoreHTTPSErrors: true 
  });

  // Skip this test in standard mock runs and CI pipeline unless LIVE_TEST=true is set
  test.beforeEach(({}, testInfo) => {
    test.skip(!process.env['LIVE_TEST'], 'Skipping live integration test. Set LIVE_TEST=true to run.');
  });

  test('should reproduce Host stuck in Setup and Guest stranded with question mark', async ({ browser }) => {
    console.log('Initiating Bug-02 Reproduction test against live containers...');

    // 1. Create two isolated browser contexts representing Host (Player 1) and Guest (Player 2)
    const hostContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const hostPage = await hostContext.newPage();

    const guestContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const guestPage = await guestContext.newPage();

    // 2. Host (Chrome/Player 1): Navigate to Home and create a new game session
    console.log('Host: Creating game session...');
    await hostPage.goto('/');
    await expect(hostPage.getByRole('heading', { name: /Basta/i })).toBeVisible();

    // Fill the Host nickname in the create game form
    await hostPage.locator('form:not([showJoinForm]) input[formControlName="nickname"]').fill('HostPlayer');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();

    // Wait for the Host to navigate to the lobby page
    await hostPage.waitForURL(/.*\/lobby\/.*/);
    const hostUrl = hostPage.url();
    const gameCodeMatch = hostUrl.match(/\/lobby\/([A-Z0-9]+)/);
    if (!gameCodeMatch) {
      throw new Error(`Failed to parse game code from lobby URL: ${hostUrl}`);
    }
    const gameCode = gameCodeMatch[1];
    console.log(`Live Game Session Created successfully with Code: ${gameCode}`);

    // 3. Guest (Safari/Player 2): Navigate to Home and join the Host's game
    console.log(`Guest: Joining game session ${gameCode}...`);
    await guestPage.goto('/');
    await expect(guestPage.getByRole('heading', { name: /Basta/i })).toBeVisible();

    // Open the Join Game form panel
    await guestPage.getByRole('button', { name: /Join Existing Game/i }).click();

    // Fill and submit the Join Game form
    await guestPage.locator('#joinNickname').fill('GuestPlayer');
    await guestPage.locator('input[formControlName="gameCode"]').fill(gameCode);
    await guestPage.getByRole('button', { name: 'Join Game' }).click();

    // Wait for the Guest to route to the same lobby
    await guestPage.waitForURL(new RegExp(`.*\\/lobby\\/${gameCode}`));
    console.log('Guest joined the lobby. Synchronized lobby view confirmed.');

    // 4. Host: Configure game settings and proceed to Setup screen
    const configureBtn = hostPage.getByRole('button', { name: /Configure Game/i });
    await expect(configureBtn).toBeEnabled({ timeout: 15_000 });
    await configureBtn.click();

    // Verify navigation to Setup
    await hostPage.waitForURL(new RegExp(`.*\\/setup\\/${gameCode}`));
    await expect(hostPage.locator('.setup-form')).toBeVisible();

    // Select the first category to make the start button active
    const categoryCard = hostPage.locator('.category-card').first();
    await categoryCard.click();

    // 5. Host: Attempt to Start the Game (Triggers Bug-02)
    console.log('Host: Clicking "Start Game" to initiate gameplay...');
    const startGameBtn = hostPage.getByRole('button', { name: /Start Game/i });
    await expect(startGameBtn).toBeEnabled();
    await startGameBtn.click();

    // 6. ASSERT HAPPY PATH (BUG-02 IS RESOLVED)
    console.log('Asserting Bug-02 is resolved and game starts successfully...');

    // Symptom A Resolution: Host (Player 1) is successfully routed to the game screen
    console.log('Asserting Host (Player 1) routed to the game screen...');
    await expect(hostPage).toHaveURL(new RegExp(`.*\\/game\\/${gameCode}`), { timeout: 10_000 });

    // Symptom B Resolution: Guest (Player 2) is successfully routed to the game screen and letter is populated
    console.log('Asserting Guest (Player 2) routed to the game screen...');
    await expect(guestPage).toHaveURL(new RegExp(`.*\\/game\\/${gameCode}`), { timeout: 10_000 });
    
    // Check that the displayed letter is loaded and is a valid letter (not "?")
    const letterValueElement = guestPage.locator('app-letter-display .value');
    await expect(letterValueElement).toBeVisible();
    
    // Wait for the letter to be populated (should be a single character A-Z and not '?')
    await expect(async () => {
      const letterText = (await letterValueElement.innerText()).trim();
      console.log(`Guest letter display reads: "${letterText}"`);
      expect(letterText).not.toBe('?');
      expect(letterText.length).toBe(1);
      expect(letterText).toMatch(/^[A-Z]$/);
    }).toPass({ timeout: 5000 });

    const letterText = (await letterValueElement.innerText()).trim();

    // Confirm that the inputs are visible and have a valid dynamic letter prefix/placeholder
    const activeInputs = guestPage.locator('input[type="text"]');
    const inputCount = await activeInputs.count();
    console.log(`Found ${inputCount} category input fields on game screen.`);
    expect(inputCount).toBeGreaterThan(0);
    
    for (let i = 0; i < inputCount; i++) {
      await expect(activeInputs.nth(i)).toBeVisible();
      const placeholder = await activeInputs.nth(i).getAttribute('placeholder');
      console.log(`Input ${i} placeholder: "${placeholder}"`);
      expect(placeholder).toBe(`Starts with ${letterText}`);
    }

    console.log('Bug-02 fix successfully verified! Game starts correctly.');

    // Clean up
    await hostContext.close();
    await guestContext.close();
  });
});
