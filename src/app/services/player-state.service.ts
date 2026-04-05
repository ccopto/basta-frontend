import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PlayerState {
  userId: number | null;
  nickname: string;
  isHost: boolean;
  gameCode: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerStateService {
  private readonly STATE_KEY = 'basta_player_state';
  
  private initialState: PlayerState = {
    userId: null,
    nickname: '',
    isHost: false,
    gameCode: null
  };

  private stateSubject = new BehaviorSubject<PlayerState>(this.loadState());
  public state$ = this.stateSubject.asObservable();

  constructor() { }

  public get currentState(): PlayerState {
    return this.stateSubject.value;
  }

  public updateState(partialState: Partial<PlayerState>): void {
    const newState = { ...this.currentState, ...partialState };
    this.stateSubject.next(newState);
    this.saveState(newState);
  }

  public clearState(): void {
    this.stateSubject.next(this.initialState);
    sessionStorage.removeItem(this.STATE_KEY);
  }

  private loadState(): PlayerState {
    const saved = sessionStorage.getItem(this.STATE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse player state', e);
      }
    }
    return this.initialState;
  }

  private saveState(state: PlayerState): void {
    sessionStorage.setItem(this.STATE_KEY, JSON.stringify(state));
  }
}
