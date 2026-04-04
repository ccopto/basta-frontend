import { Component } from '@angular/core';

@Component({
  selector: 'app-game',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Game In Progress</h1>
      <p>Fill in your answers before time runs out!</p>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class GameComponent {}
