import { Page } from '@playwright/test';

export const DEFAULT_LOBBY_SNAPSHOT = {
  gameCode: 'ABCD',
  totalRounds: 5,
  timerDuration: 60,
  language: 'en',
  state: 'Lobby',
  players: [
    { userId: 1, nickname: 'Host', isHost: true, isOnline: true, totalScore: 0 },
  ],
  selectedCategoryIds: [1],
  hostUserId: 1,
};

export const DEFAULT_CATEGORIES = [
  { categoryId: 1, name: 'Fruits' },
  { categoryId: 2, name: 'Animals' },
];

export async function mockGetCategories(page: Page, categories = DEFAULT_CATEGORIES) {
  await page.route('**/api/categories**', (route) =>
    route.fulfill({ json: categories })
  );
}

export async function mockGetGame(page: Page, gameCode: string, body = DEFAULT_LOBBY_SNAPSHOT) {
  await page.route(`**/api/games/${gameCode}`, (route) =>
    route.fulfill({ json: body })
  );
}

export async function mockCreateGame(page: Page, gameCode: string, hostUserId = 1) {
  await page.route('**/api/games', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ json: { gameCode, hostUserId } });
    } else {
      await route.continue();
    }
  });
}

export async function mockSignalRNegotiate(page: Page) {
  await page.route('**/hub/negotiate**', (route) =>
    route.fulfill({ json: { connectionId: 'mock-id', availableTransports: [] } })
  );
}
