import { Component, Input, Output, EventEmitter, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoringData, AnswerValidation } from '../../../models/game.models';
import { CategoryDto } from '../../../models/lobby.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-validation-grid',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="validation-container glass-panel animate-fade-in">
      <h2 class="text-2xl font-bold mb-6 text-center text-primary-light">{{ 'VALIDATION.TITLE' | translate }}</h2>

      <!-- Empty-state: all answers were dictionary-validated, no peer review needed -->
      <div *ngIf="hasPeerReviewAnswers === false" class="auto-validated-notice">
        <span class="auto-icon">✅</span>
        <p>{{ 'VALIDATION.ALL_DICTIONARY_VALIDATED' | translate }}</p>
      </div>

      <div *ngIf="hasPeerReviewAnswers" class="table-responsive">
        <table class="validation-table">
          <thead>
            <tr>
              <th>{{ 'VALIDATION.PLAYER' | translate }}</th>
              <th *ngFor="let cat of peerReviewCategories">{{ cat.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of scoringData.players" [class.is-self]="player.userId === currentUserId">
              <td class="player-cell">
                <span class="nickname">{{ player.nickname }}</span>
                <span *ngIf="player.userId === currentUserId" class="self-badge">{{ 'VALIDATION.YOU' | translate }}</span>
              </td>
              <td *ngFor="let cat of peerReviewCategories">
                <div class="answer-cell">
                  <ng-container *ngIf="getAnswer(player.answers, cat.categoryId) as av; else noAnswer">
                    <span class="answer-text">{{ av.answer }}</span>
                    <!-- Peer review prompt badge -->
                    <span class="peer-prompt" data-testid="peer-review-prompt">
                      📖 {{ 'VALIDATION.PEER_REVIEW_NEEDED' | translate }}
                    </span>

                    <!-- Toggle only for current user's own answers -->
                    <div *ngIf="player.userId === currentUserId" class="toggle-container">
                      <button
                        class="toggle-btn"
                        [class.valid]="validations[cat.categoryId]"
                        [class.invalid]="!validations[cat.categoryId]"
                        (click)="toggleValidation(cat.categoryId)">
                        {{ (validations[cat.categoryId] ? 'VALIDATION.VALID' : 'VALIDATION.INVALID') | translate }}
                      </button>
                    </div>
                  </ng-container>
                  <ng-template #noAnswer>
                    <span class="answer-text muted">-</span>
                  </ng-template>
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

    .auto-validated-notice {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem;
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.25);
      border-radius: 12px;
      text-align: center;
      margin-bottom: 1.5rem;
      color: #4ade80;
    }
    .auto-validated-notice .auto-icon { font-size: 2.5rem; }
    .auto-validated-notice p { font-size: 1rem; }

    .peer-prompt {
      font-size: 0.72rem;
      color: #facc15;
      background: rgba(250, 204, 21, 0.1);
      border: 1px solid rgba(250, 204, 21, 0.25);
      border-radius: 6px;
      padding: 2px 6px;
      display: inline-block;
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
      gap: 0.4rem;
      min-width: 120px;
    }

    .answer-text {
      color: rgba(255, 255, 255, 0.9);
      font-style: italic;
    }
    .answer-text.muted { color: rgba(255,255,255,0.3); }

    .toggle-container { margin-top: 0.25rem; }

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

  /** Categories that have at least one answer requiring peer review. */
  get peerReviewCategories(): CategoryDto[] {
    const peerCategoryIds = new Set<number>();
    for (const player of this.scoringData?.players ?? []) {
      for (const av of player.answers) {
        if (av.requiresPeerReview) {
          peerCategoryIds.add(av.categoryId);
        }
      }
    }
    return this.categories.filter(c => peerCategoryIds.has(c.categoryId));
  }

  /** True when at least one answer in the round requires peer review. */
  get hasPeerReviewAnswers(): boolean {
    return this.peerReviewCategories.length > 0;
  }

  ngOnInit() {
    // Initialize validations only for categories that need peer review
    this.peerReviewCategories.forEach(cat => {
      this.validations[cat.categoryId] = true;
    });
  }

  getAnswer(answers: AnswerValidation[], categoryId: number): AnswerValidation | undefined {
    return answers.find(a => a.categoryId === categoryId && a.requiresPeerReview);
  }

  toggleValidation(categoryId: number) {
    this.validations[categoryId] = !this.validations[categoryId];
  }

  submit() {
    this.onValidated.emit(this.validations);
  }
}
