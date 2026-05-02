import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlayerStateService } from '../services/player-state.service';

export const setupGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const playerState = inject(PlayerStateService);
  const expectedGameCode = route.paramMap.get('code');

  // Ensure state is fresh from storage
  playerState.refreshFromStorage();

  const { isHost, gameCode } = playerState.currentState;

  if (gameCode && gameCode === expectedGameCode && isHost) {
    return true;
  }

  // Clear any potentially stale state to avoid corrupted local state
  playerState.clearState();

  // Route them back to home screen
  return router.createUrlTree(['/home']);
};
