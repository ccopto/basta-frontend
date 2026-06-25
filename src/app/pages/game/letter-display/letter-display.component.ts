import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-letter-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showOverlay) {
      <div class="letter-overlay">
        <div class="letter-box">
          <span class="reveal-label">Letter:</span>
          <h1 class="reveal-letter">{{ letter }}</h1>
        </div>
      </div>
    }
    
    <div class="active-letter">
      <span class="label">Letter</span>
      <span class="value" data-testid="game-letter">{{ letter || '?' }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .active-letter {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      padding: var(--space-xs) var(--space-md);
      border-radius: var(--radius-md);
      min-width: 80px;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      color: var(--color-text-muted);
      font-weight: 700;
    }
    .value {
      font-size: var(--font-size-xl);
      font-weight: 900;
      color: var(--color-primary);
    }
    .letter-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }
    .letter-box {
      text-align: center;
      animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .reveal-label {
      color: var(--color-text-muted);
      font-size: var(--font-size-lg);
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }
    .reveal-letter {
      font-size: 12rem;
      font-weight: 950;
      background: linear-gradient(135deg, white 0%, var(--color-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      line-height: 1;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class LetterDisplayComponent {
  @Input() letter: string = '';
  @Input() showOverlay: boolean = false;
}
