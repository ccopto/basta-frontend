import { Routes } from '@angular/router';
import { lobbyGuard } from './guards/lobby.guard';
import { setupGuard } from './guards/setup.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Basta! — Home'
  },
  {
    path: 'lobby/:code',
    loadComponent: () => import('./pages/lobby/lobby.component').then(m => m.LobbyComponent),
    canActivate: [lobbyGuard],
    title: 'Basta! — Lobby'
  },
  {
    path: 'setup/:code',
    loadComponent: () => import('./pages/game-setup/game-setup.component').then(m => m.GameSetupComponent),
    canActivate: [setupGuard],
    title: 'Basta! — Game Setup'
  },
  {
    path: 'game/:code',
    loadComponent: () => import('./pages/game/game.component').then(m => m.GameComponent),
    title: 'Basta! — Game'
  },
  {
    path: 'scoring/:code',
    loadComponent: () => import('./pages/scoring/scoring.component').then(m => m.ScoringComponent),
    title: 'Basta! — Scoring'
  },
  {
    path: 'game-over/:code',
    loadComponent: () => import('./pages/game-over/game-over.component').then(m => m.GameOverComponent),
    title: 'Basta! — Game Over'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
