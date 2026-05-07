import { test as base, expect } from '@playwright/test';
import { triggerSignalR } from '../helpers/signalr';
import { seedPlayerState, BastaPlayerState } from '../helpers/session';
import {
  mockGetCategories,
  mockGetGame,
  mockCreateGame,
  mockSignalRNegotiate,
} from '../helpers/api-mocks';

type BastaFixtures = {
  triggerSignalR: (eventName: string, data: unknown) => Promise<void>;
  seedPlayerState: (state: BastaPlayerState) => Promise<void>;
  mocks: {
    categories: (cats?: any) => Promise<void>;
    game: (code: string, body?: any) => Promise<void>;
    createGame: (code: string, hostId?: number) => Promise<void>;
    signalRNegotiate: () => Promise<void>;
  };
};

export const test = base.extend<BastaFixtures>({
  triggerSignalR: async ({ page }, use) => {
    await use((eventName, data) => triggerSignalR(page, eventName, data));
  },
  seedPlayerState: async ({ page }, use) => {
    await use((state) => seedPlayerState(page, state));
  },
  mocks: async ({ page }, use) => {
    await use({
      categories: (cats?) => mockGetCategories(page, cats),
      game: (code, body?) => mockGetGame(page, code, body),
      createGame: (code, hostId?) => mockCreateGame(page, code, hostId),
      signalRNegotiate: () => mockSignalRNegotiate(page),
    });
  },
});

export { expect };
