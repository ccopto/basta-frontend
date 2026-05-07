import { Injectable, signal } from '@angular/core';
import { LeaderboardDto } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class GameResultsService {
  private _results = signal<LeaderboardDto | null>(null);
  
  readonly results = this._results.asReadonly();

  setResults(results: LeaderboardDto) {
    this._results.set(results);
  }

  clearResults() {
    this._results.set(null);
  }
}
