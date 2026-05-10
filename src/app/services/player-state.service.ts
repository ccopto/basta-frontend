import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GAME_DEFAULTS } from '../constants/game.constants';

export interface PlayerState {
  userId: number | null;
  nickname: string;
  isHost: boolean;
  gameCode: string | null;
  selectedCategoryIds: number[];
  totalRounds: number;
  timerDuration: number;
  hostUserId: number | null;
  language: string;
}


@Injectable({
  providedIn: 'root'
})
export class PlayerStateService {
  private readonly STATE_KEY = 'basta_player_state';
  
  private getInitialState(): PlayerState {
    return {
      userId: null,
      nickname: '',
      isHost: false,
      gameCode: null,
      selectedCategoryIds: [],
      totalRounds: GAME_DEFAULTS.totalRounds,
      timerDuration: GAME_DEFAULTS.timerDuration,
      hostUserId: null,
      language: 'en'
    };

  }


  private stateSubject = new BehaviorSubject<PlayerState>(this.loadState());
  public state$ = this.stateSubject.asObservable();

  constructor() { }

  /**
   * Manually refresh state from sessionStorage. 
   * Useful for E2E tests or synchronization scenarios.
   */
  public refreshFromStorage(): void {
    this.stateSubject.next(this.loadState());
  }

  public get currentState(): PlayerState {
    return this.stateSubject.value;
  }

  public updateState(partialState: Partial<PlayerState>): void {
    const newState = { ...this.currentState, ...partialState };
    this.stateSubject.next(newState);
    this.saveState(newState);
  }

  public clearState(): void {
    this.stateSubject.next(this.getInitialState());
    sessionStorage.removeItem(this.STATE_KEY);
  }

  private loadState(): PlayerState {
    // Support for E2E testing: allow injecting state via global window variable
    // to bypass sessionStorage race conditions in CI environments.
    const testState = (window as any).BASTA_TEST_STATE;
    if (testState) {
      (window as any).BASTA_TEST_STATE = null;
      return testState;
    }

    const saved = sessionStorage.getItem(this.STATE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse player state', e);
      }
    }
    return this.getInitialState();
  }

  private saveState(state: PlayerState): void {
    sessionStorage.setItem(this.STATE_KEY, JSON.stringify(state));
  }
}
