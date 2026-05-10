import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoringData } from '../../../models/game.models';
import { CategoryDto } from '../../../models/lobby.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-validation-grid',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="validation-container glass-panel animate-fade-in">
      <h2 class="text-2xl font-bold mb-6 text-center text-primary-light">{{ 'VALIDATION.TITLE' | translate }}</h2>
      
      <div class="table-responsive">
        <table class="validation-table">
          <thead>
            <tr>
              <th>{{ 'VALIDATION.PLAYER' | translate }}</th>
              <th *ngFor="let cat of categories">
                {{ cat.name }}
              </th>
            </tr>

          </thead>
          <tbody>
            <tr *ngFor="let player of scoringData.players" [class.is-self]="player.userId === currentUserId">
              <td class="player-cell">
                <span class="nickname">{{ player.nickname }}</span>
                <span *ngIf="player.userId === currentUserId" class="self-badge">{{ 'VALIDATION.YOU' | translate }}</span>
              </td>
              <td *ngFor="let cat of categories">
                <div class="answer-cell">
                  <span class="answer-text">{{ player.answers[cat.categoryId] || '-' }}</span>
                  
                  <!-- Only show toggles for the current user's answers -->
                  <div *ngIf="player.userId === currentUserId && player.answers[cat.categoryId]" class="toggle-container">
                    <button 
                      class="toggle-btn" 
                      [class.valid]="validations[cat.categoryId]"
                      [class.invalid]="!validations[cat.categoryId]"
                      (click)="toggleValidation(cat.categoryId)">
                      {{ (validations[cat.categoryId] ? 'VALIDATION.VALID' : 'VALIDATION.INVALID') | translate }}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions mt-8 flex justify-center">
        <button 
          class="btn-primary btn-large" 
          [disabled]="isSubmitting"
          (click)="submit()">
          {{ (isSubmitting ? 'VALIDATION.SUBMITTING' : 'VALIDATION.CONFIRM') | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .validation-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .table-responsive {
      overflow-x: auto;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
    }

    .validation-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .validation-table th, 
    .validation-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .validation-table th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--primary-light);
      font-weight: 600;
      white-space: nowrap;
    }

    .player-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nickname {
      font-weight: 600;
      color: #fff;
    }

    .self-badge {
      font-size: 0.7rem;
      background: var(--primary);
      color: white;
      padding: 1px 6px;
      border-radius: 4px;
      width: fit-content;
    }

    .is-self {
      background: rgba(var(--primary-rgb), 0.1);
    }

    .answer-cell {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 120px;
    }

    .answer-text {
      color: rgba(255, 255, 255, 0.9);
      font-style: italic;
    }

    .toggle-container {
      margin-top: 0.25rem;
    }

    .toggle-btn {
      width: 100%;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .toggle-btn.valid {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border-color: rgba(34, 197, 94, 0.4);
    }

    .toggle-btn.invalid {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.4);
    }

    .toggle-btn:hover {
      transform: translateY(-1px);
      filter: brightness(1.2);
    }

    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ValidationGridComponent implements OnInit {
  @Input() scoringData!: ScoringData;
  @Input() categories: CategoryDto[] = [];
  @Input() currentUserId: number = 0;
  @Input() isSubmitting: boolean = false;
  
  @Output() onValidated = new EventEmitter<{ [categoryId: number]: boolean }>();

  public validations: { [categoryId: number]: boolean } = {};

  ngOnInit() {
    // Initialize all my answers as valid by default (honesty policy starts here!)
    this.categories.forEach(cat => {
      this.validations[cat.categoryId] = true;
    });
  }

  toggleValidation(categoryId: number) {
    this.validations[categoryId] = !this.validations[categoryId];
  }

  submit() {
    this.onValidated.emit(this.validations);
  }
}
