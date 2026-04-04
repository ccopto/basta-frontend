import { Component } from '@angular/core';

@Component({
  selector: 'app-lobby',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Lobby</h1>
      <p>Waiting for players to join...</p>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class LobbyComponent {}
