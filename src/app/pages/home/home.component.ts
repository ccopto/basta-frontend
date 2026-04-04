import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Home</h1>
      <p>Set your nickname, choose your language, and create or join a game.</p>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class HomeComponent {}
