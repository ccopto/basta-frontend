import { Component } from '@angular/core';

@Component({
  selector: 'app-scoring',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Scoring &amp; Validation</h1>
      <p>Review and validate answers.</p>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ScoringComponent {}
