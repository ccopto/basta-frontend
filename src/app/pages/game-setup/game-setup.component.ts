import { Component } from '@angular/core';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Game Setup</h1>
      <p>Host: configure rounds, timer, and categories.</p>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class GameSetupComponent {}
