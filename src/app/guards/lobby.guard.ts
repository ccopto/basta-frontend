import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlayerStateService } from '../services/player-state.service';

export const lobbyGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const playerState = inject(PlayerStateService);
  const expectedGameCode = route.paramMap.get('code');

  const currentCode = playerState.currentState.gameCode;

  if (currentCode && currentCode === expectedGameCode) {
    return true;
  }

  // Clear any potentially stale state to avoid corrupted local state 
  playerState.clearState();

  // Route them back to home screen
  return router.createUrlTree(['/home']);
};
