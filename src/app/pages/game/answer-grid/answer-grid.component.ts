import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AnswerMap } from '../../../models/game.models';
import { CategoryDto } from '../../../models/lobby.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-answer-grid',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <form [formGroup]="form" class="answer-grid">
      @for (cat of categories; track cat.categoryId) {
        <div class="category-card card glass">
          <label [for]="'cat-' + cat.categoryId">{{ cat.name }}</label>
          <input 
            [id]="'cat-' + cat.categoryId"
            type="text" 
            data-testid="game-answer"
            [attr.data-category-id]="cat.categoryId"
            [formControlName]="cat.categoryId.toString()"
            [placeholder]="'GAME.STARTS_WITH' | translate:{ letter: currentLetter.toUpperCase() }"
            autocomplete="off"
          >
        </div>
      }
    </form>
  `,
  styles: [`
    :host { display: block; }
    .answer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-md);
      margin-top: var(--space-lg);
    }
    .category-card {
      padding: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
    label {
      font-size: var(--font-size-xs);
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-sm);
      padding: var(--space-sm) var(--space-md);
      color: white;
      font-size: var(--font-size-md);
      transition: all var(--transition-base);
    }
    input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
    }
    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class AnswerGridComponent implements OnChanges, OnDestroy {
  @Input() categories: CategoryDto[] = [];
  @Input() currentLetter: string = '';
  @Input() isLocked: boolean = false;
  
  @Output() answersChanged = new EventEmitter<AnswerMap>();

  public form: FormGroup = new FormGroup({});
  private formValueSub?: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categories']) {
      this.initForm();
    }
    if (changes['isLocked']) {
      this.toggleLock();
    }
  }

  private initForm() {
    this.formValueSub?.unsubscribe();
    const group: any = {};
    this.categories.forEach(cat => {
      group[cat.categoryId.toString()] = new FormControl('');
    });
    this.form = new FormGroup(group);
    
    this.formValueSub = this.form.valueChanges.subscribe(val => {
      this.answersChanged.emit(val as AnswerMap);
    });
  }

  ngOnDestroy() {
    this.formValueSub?.unsubscribe();
  }


  private toggleLock() {
    if (this.isLocked) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }

  public getValues(): AnswerMap {
    return this.form.getRawValue() as AnswerMap;
  }
}
