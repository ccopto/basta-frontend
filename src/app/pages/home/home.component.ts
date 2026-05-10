import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GameService } from '../../services/game.service';
import { PlayerStateService } from '../../services/player-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="landing">

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content animate-fade-in-up">
          <h1 class="hero-title">
            <span class="hero-accent">{{ 'HOME.TITLE' | translate | slice:0:1 }}</span>{{ 'HOME.TITLE' | translate | slice:1:-1 }}<span class="hero-accent">{{ 'HOME.TITLE' | translate | slice:-1 }}</span>
          </h1>
          <p class="hero-subtitle">{{ 'HOME.SUBTITLE' | translate }}</p>
          <p class="hero-description">
            {{ 'HOME.DESCRIPTION' | translate }}
            <strong>{{ 'HOME.BASTA' | translate }}</strong>
          </p>
        </div>
      </section>

      <!-- Action Area -->
      <section class="action-section animate-scale-in">
        <div class="glass-card form-card">
          <h2 class="form-title">{{ 'HOME.START_PLAYING' | translate }}</h2>
          
          <form *ngIf="!showJoinForm" [formGroup]="gameForm" (ngSubmit)="onCreateGame()">
            <div class="form-group">
              <label for="nickname">{{ 'HOME.CHOOSE_NICKNAME' | translate }}</label>
              <input 
                type="text" 
                id="nickname" 
                formControlName="nickname" 
                placeholder="e.g. WordMaster99" 
                maxlength="50"
                autocomplete="off"
              />
              <div *ngIf="gameForm.get('nickname')?.touched && gameForm.get('nickname')?.invalid" class="error-msg" data-cy="nickname-error">
                {{ 'HOME.ERRORS.NICKNAME_REQUIRED' | translate }}
              </div>
            </div>
+
            <div class="form-group">
              <label for="language">{{ 'HOME.GAME_LANGUAGE' | translate }}</label>
              <select id="language" formControlName="language" (change)="onLanguageChange($event)">
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="gameForm.invalid || isLoading">
                {{ (isLoading ? 'HOME.CREATING' : 'HOME.CREATE_GAME') | translate }}
              </button>
              
              <div class="divider"><span>{{ 'HOME.OR' | translate }}</span></div>
              
              <button type="button" class="btn btn-secondary" (click)="onJoinGame()">
                {{ 'HOME.JOIN_EXISTING' | translate }}
              </button>
            </div>

            <div *ngIf="errorMessage && !showJoinForm" class="error-msg global-error">
              {{ errorMessage }}
            </div>
          </form>

          <form *ngIf="showJoinForm" [formGroup]="joinForm" (ngSubmit)="onJoinSubmit()">
            <div class="form-group">
              <label for="joinNickname">{{ 'HOME.YOUR_NICKNAME' | translate }}</label>
              <input 
                type="text" 
                id="joinNickname" 
                formControlName="nickname" 
                placeholder="e.g. WordMaster99" 
                maxlength="50"
                autocomplete="off"
              />
              <div *ngIf="joinForm.get('nickname')?.touched && joinForm.get('nickname')?.invalid" class="error-msg">
                {{ 'HOME.ERRORS.NICKNAME_REQUIRED' | translate }}
              </div>
            </div>

            <div class="form-group">
              <label for="gameCode">{{ 'HOME.GAME_CODE' | translate }}</label>
              <input 
                type="text" 
                id="gameCode" 
                formControlName="gameCode" 
                placeholder="e.g. ABCD" 
                maxlength="10"
                autocomplete="off"
                style="text-transform: uppercase;"
              />
              <div *ngIf="joinForm.get('gameCode')?.touched && joinForm.get('gameCode')?.invalid" class="error-msg">
                {{ 'HOME.ERRORS.GAME_CODE_REQUIRED' | translate }}
              </div>
            </div>

            <div class="form-group">
              <label for="joinLanguage">{{ 'HOME.PREFERRED_LANGUAGE' | translate }}</label>
              <select id="joinLanguage" formControlName="language" (change)="onLanguageChange($event)">
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="joinForm.invalid || isLoading">
                {{ (isLoading ? 'HOME.JOINING' : 'HOME.JOIN_GAME') | translate }}
              </button>
              
              <div class="divider"><span>{{ 'HOME.OR' | translate }}</span></div>
              
              <button type="button" class="btn btn-secondary" (click)="onJoinGame()">
                {{ 'HOME.BACK_TO_CREATE' | translate }}
              </button>
            </div>

            <div *ngIf="errorMessage && showJoinForm" class="error-msg global-error">
              {{ errorMessage }}
            </div>
          </form>
        </div>
      </section>

      <!-- Features Preview -->
      <section class="features-section animate-fade-in">
        <div class="features-grid">
          <div class="glass-card feature-card">
            <div class="feature-icon">🎲</div>
            <h3>Random Letters</h3>
            <p>Each round picks a unique letter — no repeats within a session.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon">⏱️</div>
            <h3>Timed Rounds</h3>
            <p>30 to 120 seconds per round. The host controls the pace.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon">🌎</div>
            <h3>Bilingual</h3>
            <p>Play in English or Spanish — switch at any time.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon">👥</div>
            <h3>Up to 5 Players</h3>
            <p>Quick sessions with friends — competitive and fun.</p>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .landing {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-lg);
    }

    /* --- Hero --- */
    .hero {
      text-align: center;
      padding: var(--space-2xl) 0 var(--space-lg);
    }

    .hero-title {
      font-size: clamp(3rem, 8vw, 6rem);
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
      margin-bottom: var(--space-xs);
    }

    .hero-accent {
      background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: var(--font-size-2xl);
      font-weight: 300;
      color: var(--color-text-secondary);
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin-bottom: var(--space-lg);
    }

    .hero-description {
      font-size: var(--font-size-lg);
      color: var(--color-text-secondary);
      max-width: 480px;
      margin: 0 auto;
      line-height: 1.7;
    }

    .hero-description strong {
      color: var(--color-accent-light);
      font-weight: 600;
    }

    /* --- Action Section & Forms --- */
    .action-section {
      width: 100%;
      max-width: 400px;
      margin-bottom: var(--space-2xl);
      position: relative;
      z-index: 10;
    }

    .form-card {
      padding: var(--space-xl);
    }

    .form-title {
      text-align: center;
      margin-bottom: var(--space-lg);
      font-size: var(--font-size-xl);
    }

    .form-group {
      margin-bottom: var(--space-md);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-xs);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .error-msg {
      color: var(--color-error);
      font-size: var(--font-size-xs);
      margin-top: var(--space-xs);
    }

    .global-error {
      margin-top: var(--space-md);
      text-align: center;
      padding: var(--space-sm);
      background: hsla(0, 84%, 60%, 0.1);
      border-radius: var(--radius-sm);
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
    }
    
    .form-actions .btn {
      width: 100%;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      margin: var(--space-xs) 0;
    }
    
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--color-border);
    }

    .divider span {
      padding: 0 var(--space-sm);
    }

    /* --- Features --- */
    .features-section {
      width: 100%;
      max-width: 800px;
      margin-bottom: var(--space-2xl);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
    }

    .feature-card {
      text-align: center;
      padding: var(--space-lg);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: var(--space-sm);
    }

    .feature-card h3 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--space-xs);
    }

    .feature-card p {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    /* --- Responsive --- */
    @media (max-width: 600px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {
  gameForm: FormGroup;
  joinForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showJoinForm = false;

  constructor(
    private fb: FormBuilder,
    private gameService: GameService,
    private playerState: PlayerStateService,
    private router: Router
  ) {
    // Populate with existing nickname if they came back to the home page
    const existingNick = this.playerState.currentState.nickname;

    this.gameForm = this.fb.group({
      nickname: [existingNick, [Validators.required, Validators.pattern(/.*[^\s].*/)]],
      language: [this.playerState.currentState.language]
    });

    this.joinForm = this.fb.group({
      nickname: [existingNick, [Validators.required, Validators.pattern(/.*[^\s].*/)]],
      gameCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{4}$/i)]],
      language: [this.playerState.currentState.language]
    });
  }

  onLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const lang = target.value;
    this.playerState.updateState({ language: lang });
    
    // Sync both forms
    this.gameForm.patchValue({ language: lang }, { emitEvent: false });
    this.joinForm.patchValue({ language: lang }, { emitEvent: false });
  }

  onCreateGame() {
    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const req = {
      hostNickname: this.gameForm.value.nickname,
      preferredLanguage: this.gameForm.value.language,
      totalRounds: GameService.DEFAULT_ROUNDS,
      timerDuration: GameService.DEFAULT_TIMER,
      categoryIds: [1] // Default category to satisfy API validation; host will reconfigure this on the setup page
    };

    this.gameService.createGame(req).subscribe({
      next: (res) => {
        this.isLoading = false;
        
        // Update local state
        this.playerState.updateState({
          userId: res.hostUserId,
          nickname: req.hostNickname.trim(),
          isHost: true,
          gameCode: res.gameCode,
          hostUserId: res.hostUserId
        });

        // Navigate to lobby
        this.router.navigate(['/lobby', res.gameCode]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to create game. Please try again.';
        console.error('Create game error', err);
      }
    });

  }

  onJoinGame() {
    this.showJoinForm = !this.showJoinForm;
    this.errorMessage = '';
  }

  onJoinSubmit() {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const req = {
      nickname: this.joinForm.value.nickname.trim(),
      preferredLanguage: this.joinForm.value.language
    };

    const gameCode = this.joinForm.value.gameCode.trim().toUpperCase();

    this.gameService.joinGame(gameCode, req).subscribe({
      next: (res) => {
        this.isLoading = false;
        
        // Update local state
        this.playerState.updateState({
          userId: res.userId,
          nickname: req.nickname,
          isHost: false,
          gameCode: res.gameCode
        });

        // Navigate to lobby
        this.router.navigate(['/lobby', res.gameCode]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Could not join. Check the game code and try again.';
        console.error('Join game error', err);
      }
    });
  }
}
