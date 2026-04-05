import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateGameRequest {
  hostNickname: string;
  preferredLanguage: string;
  totalRounds: number;
  timerDuration: number;
}

export interface CreateGameResponse {
  gameCode: string;
  hostUserId: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(private api: ApiService) {}

  public createGame(request: CreateGameRequest): Observable<CreateGameResponse> {
    return this.api.post<CreateGameResponse>('/games', request);
  }
}
