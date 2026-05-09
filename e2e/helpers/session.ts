import { Page } from '@playwright/test';

export interface BastaPlayerState {
  userId: number;
  nickname: string;
  isHost: boolean;
  gameCode: string;
  hostUserId?: number;
  selectedCategoryIds?: number[];
  totalRounds?: number;
  timerDuration?: number;
}

export async function seedPlayerState(page: Page, state: BastaPlayerState): Promise<void> {
  await page.addInitScript((stateJson: string) => {
    sessionStorage.setItem('basta_player_state', stateJson);
    (window as any).BASTA_TEST_STATE = JSON.parse(stateJson);
  }, JSON.stringify(state));
}
