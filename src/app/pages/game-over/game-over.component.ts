import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LeaderboardDto } from '../../models/game.models';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { GameResultsService } from '../../services/game-results.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule, RouterLink, LeaderboardComponent, TranslateModule],
  template: `
    <div class="page-container animate-fade-in">
      <header class="header text-center mb-10">
        <h1 class="text-5xl font-black text-white mb-2">{{ 'GAME_OVER.TITLE' | translate }}</h1>
        <p class="text-xl text-primary-light font-semibold uppercase tracking-widest">
          {{ leaderboard()?.reason || ('GAME_OVER.FINAL_STANDINGS' | translate) }}
        </p>
      </header>

      <main class="content mb-12">
        <app-leaderboard [players]="leaderboard()?.players || []"></app-leaderboard>
      </main>

      <footer class="actions flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button class="btn btn-primary btn-xl basta-btn" routerLink="/home">
          {{ 'GAME_OVER.PLAY_AGAIN' | translate }}
        </button>
        <button class="btn btn-outline btn-lg" routerLink="/home">
          {{ 'GAME_OVER.EXIT_HOME' | translate }}
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
  public leaderboard = this.gameResultsService.results;

  constructor(
    private router: Router,
    private gameResultsService: GameResultsService
  ) {}

  ngOnInit() {
    if (!this.leaderboard()) {
      console.warn('No leaderboard data found in GameResultsService. Redirecting to home.');
      this.router.navigate(['/home']);
    }
  }
}
