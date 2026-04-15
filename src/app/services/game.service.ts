import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
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
  public static readonly DEFAULT_ROUNDS = 5;
  public static readonly DEFAULT_TIMER = 60;

  constructor(private api: ApiService) {}

  public createGame(request: CreateGameRequest): Observable<CreateGameResponse> {
    return this.api.post<CreateGameResponse>('/games', request).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred.';
    
    // Check if the error matches RFC 7807 ProblemDetails shape
    if (error.error && error.error.title) {
      errorMessage = error.error.title;
      if (error.error.detail) {
        errorMessage += ` ${error.error.detail}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
