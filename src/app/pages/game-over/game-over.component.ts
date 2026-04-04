import { Component } from '@angular/core';

@Component({
  selector: 'app-game-over',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Game Over</h1>
      <p>Final leaderboard and results.</p>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class GameOverComponent {}
