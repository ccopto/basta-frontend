import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlayerStateService } from '../services/player-state.service';

export const gameGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const playerState = inject(PlayerStateService);
  const expectedGameCode = route.paramMap.get('code');

  const { gameCode, nickname, userId } = playerState.currentState;

  // Most basic check: player must be part of this game and identified
  if (gameCode && gameCode === expectedGameCode && nickname && userId) {
    return true;
  }

  // If session mismatch or unauthenticated, kicked back home
  playerState.clearState();
  return router.createUrlTree(['/home']);
};
