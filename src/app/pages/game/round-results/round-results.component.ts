import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerScore } from '../../../models/game.models';
import { CategoryDto } from '../../../models/lobby.models';

@Component({
  selector: 'app-round-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="results-container glass-panel animate-scale-up">
      <h2 class="text-3xl font-bold mb-2 text-center text-primary-light">Round Results</h2>
      <p class="text-center text-white/60 mb-8">Points have been awarded!</p>
      
      <div class="results-grid">
        <div *ngFor="let player of scores" class="player-result-card" [class.is-self]="player.userId === currentUserId">
          <div class="card-header">
            <span class="nickname">{{ player.nickname }}</span>
            <div class="score-summary">
              <span class="round-pts">+{{ player.roundScore }} pts</span>
              <span class="total-pts">Total: {{ player.cumulativeScore }}</span>
            </div>
          </div>
          
          <div class="answer-list">
            <div *ngFor="let ans of player.answers" class="answer-item">
              <span class="category-name">{{ getCategoryName(ans.categoryId) }}</span>
              <div class="answer-details">
                <span class="answer-text" [class.invalid]="!ans.isValid">
                  {{ ans.answer || '(Blank)' }}
                </span>
                <span class="pts-badge" [class.unique]="ans.isUnique" [class.shared]="ans.isValid && !ans.isUnique">
                  {{ ans.points }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="isHost" class="actions mt-10 flex justify-center">
        <button class="btn-primary btn-xl" (click)="onNextRound.emit()">
          Start Next Round
        </button>
      </div>
      <p *ngIf="!isHost" class="text-center text-white/50 mt-10 italic">
        Waiting for host to start the next round...
      </p>
    </div>
  `,
  styles: [`
    .results-container {
      padding: 2.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .player-result-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .player-result-card.is-self {
      border-color: var(--primary);
      background: rgba(var(--primary-rgb), 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.75rem;
    }

    .nickname {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
    }

    .score-summary {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .round-pts {
      color: #4ade80;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .total-pts {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .answer-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .answer-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .category-name {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.8rem;
    }

    .answer-details {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .answer-text {
      color: #fff;
      font-weight: 500;
    }

    .answer-text.invalid {
      color: #f87171;
      text-decoration: line-through;
      opacity: 0.6;
    }

    .pts-badge {
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      font-size: 0.75rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.8);
    }

    .pts-badge.unique {
      background: rgba(var(--primary-rgb), 0.3);
      color: var(--primary-light);
      border: 1px solid var(--primary);
    }

    .pts-badge.shared {
      background: rgba(168, 85, 247, 0.3);
      color: #d8b4fe;
      border: 1px solid #a855f7;
    }

    .animate-scale-up {
      animation: scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class RoundResultsComponent {
  @Input() scores: PlayerScore[] = [];
  @Input() categories: CategoryDto[] = [];
  @Input() currentUserId: number = 0;
  @Input() isHost: boolean = false;
  
  @Output() onNextRound = new EventEmitter<void>();

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.categoryId === categoryId)?.name || 'Category';
  }

}
