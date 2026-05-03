import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LeaderboardDto } from '../../models/game.models';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule, RouterLink, LeaderboardComponent],
  template: `
    <div class="page-container animate-fade-in">
      <header class="header text-center mb-10">
        <h1 class="text-5xl font-black text-white mb-2">GAME OVER</h1>
        <p class="text-xl text-primary-light font-semibold uppercase tracking-widest">
          {{ leaderboard?.reason || 'Session Finished' }}
        </p>
      </header>

      <main class="content mb-12">
        <app-leaderboard [players]="leaderboard?.players || []"></app-leaderboard>
      </main>

      <footer class="actions flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button class="btn btn-primary btn-xl basta-btn" routerLink="/home">
          PLAY AGAIN
        </button>
        <button class="btn btn-outline btn-lg" routerLink="/home">
          EXIT TO HOME
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      padding: 4rem 1rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .basta-btn {
      min-width: 250px;
    }

    @media (max-width: 640px) {
      .page-container { padding: 2rem 1rem; }
      h1 { font-size: 3rem; }
    }
  `]
})
export class GameOverComponent implements OnInit {
  public leaderboard?: LeaderboardDto;

  constructor(private router: Router) {}

  ngOnInit() {
    this.leaderboard = window.history.state?.['leaderboard'];

    if (!this.leaderboard) {
      console.warn('No leaderboard data found in router state. Redirecting to home.');
      this.router.navigate(['/home']);
    }
  }
}
