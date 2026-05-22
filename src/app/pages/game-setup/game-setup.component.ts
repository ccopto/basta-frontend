import { Component, OnInit, OnDestroy, signal, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, tap } from 'rxjs/operators';
import { GameService } from '../../services/game.service';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { CategoryDto, LobbySnapshot } from '../../models/lobby.models';
import { GAME_DEFAULTS } from '../../constants/game.constants';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="setup-wrapper">
      <div class="glass-card setup-card animate-scale-in">
        <header class="setup-header">
          <h1 class="game-code">{{ gameCode }}</h1>
          <h2>{{ 'SETUP.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'SETUP.CATEGORIES' | translate }}</p>
        </header>

        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'HOME.JOINING' | translate }}</p>
        </div>

        <div *ngIf="errorMessage" class="error-msg global-error">
          {{ errorMessage }}
        </div>

        <form class="setup-form" *ngIf="!loading && lobbyState">
          <!-- Interactive Settings -->
          <div class="settings-grid">
            <div class="setting-item animate-fade-in" style="animation-delay: 100ms">
              <label>{{ 'SETUP.ROUNDS' | translate }}</label>
              <div class="stepper">
                <button type="button" class="step-btn" (click)="updateRounds(-1)" [disabled]="totalRounds() <= GAME_DEFAULTS.minRounds">−</button>
                <div class="step-value-container">
                  <span class="step-value">{{ totalRounds() }}</span>
                  <span class="step-unit">{{ 'SETUP.ROUNDS' | translate }}</span>
                </div>
                <button type="button" class="step-btn" (click)="updateRounds(1)" [disabled]="totalRounds() >= GAME_DEFAULTS.maxRounds">+</button>
              </div>
            </div>
            
            <div class="setting-item animate-fade-in" style="animation-delay: 200ms">
              <label>{{ 'SETUP.TIMER' | translate }}</label>
              <div class="stepper">
                <button type="button" class="step-btn" (click)="updateTimer(-15)" [disabled]="timerDuration() <= GAME_DEFAULTS.minTimer">−</button>
                <div class="step-value-container">
                  <span class="step-value">{{ timerDuration() }}</span>
                  <span class="step-unit">{{ 'SETUP.TIMER_SECONDS' | translate }}</span>
                </div>
                <button type="button" class="step-btn" (click)="updateTimer(15)" [disabled]="timerDuration() >= GAME_DEFAULTS.maxTimer">+</button>
              </div>
            </div>

            <!-- Language Selector -->
            <div class="setting-item animate-fade-in lang-setting" style="animation-delay: 300ms">
              <label>{{ 'SETUP.LANGUAGE' | translate }}</label>
              <div class="lang-pills">
                <button type="button"
                  class="lang-pill"
                  [class.active]="gameLanguage() === 'en'"
                  (click)="setLanguage('en')">
                  🇺🇸 {{ 'SETUP.LANGUAGE_EN' | translate }}
                </button>
                <button type="button"
                  class="lang-pill"
                  [class.active]="gameLanguage() === 'es'"
                  (click)="setLanguage('es')">
                  🇪🇸 {{ 'SETUP.LANGUAGE_ES' | translate }}
                </button>
              </div>
            </div>

          </div>

          <!-- Categories -->
          <div class="form-group categories-group">
            <label>{{ 'SETUP.CATEGORIES' | translate }} <span class="required">*</span></label>
            <p class="hint">{{ 'SETUP.SELECTED_CATEGORIES' | translate:{ count: selectedCategoryIds.size } }}</p>
            
            <div class="categories-grid">
              <div class="category-card hover-scale" 
                   *ngFor="let cat of availableCategories"
                   [class.selected]="selectedCategoryIds.has(cat.categoryId)"
                   (click)="toggleCategory(cat.categoryId)">
                <div class="cat-content">
                  <span class="cat-name">{{ cat.name }}</span>
                  <div class="checkbox" [class.checked]="selectedCategoryIds.has(cat.categoryId)">
                    <span *ngIf="selectedCategoryIds.has(cat.categoryId)">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="setup-actions">
            <button type="button" class="btn btn-secondary btn-block" (click)="onBack()">
              {{ 'SETUP.BACK_TO_LOBBY' | translate }}
            </button>
            <button type="button" class="btn btn-primary btn-block" 
                    [disabled]="selectedCategoryIds.size === 0 || isStarting" 
                    (click)="onStartGame()">
              {{ (isStarting ? 'HOME.CREATING' : 'SETUP.START_GAME') | translate }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .setup-wrapper {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--space-lg);
    }

    .setup-card {
      width: 100%;
      max-width: 600px;
      padding: var(--space-xl);
    }

    .setup-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }

    .game-code {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      margin: 0;
      background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .setup-header h2 {
      margin-top: var(--space-sm);
      margin-bottom: 0;
      font-size: 1.5rem;
    }

    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin-top: var(--space-xs);
    }

    .setup-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }

    .lang-setting {
      grid-column: 1 / -1; /* full width */
    }

    .lang-pills {
      display: flex;
      gap: var(--space-sm);
      justify-content: center;
      margin-top: var(--space-xs);
    }

    .lang-pill {
      flex: 1;
      padding: 0.6rem 1rem;
      border-radius: 999px;
      border: 2px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .lang-pill:hover { border-color: rgba(255,255,255,0.35); color: #fff; }
    .lang-pill.active {
      background: rgba(var(--color-primary-rgb), 0.2);
      border-color: var(--color-primary);
      color: var(--color-primary-light);
    }

    .setting-item {
      background: rgba(255, 255, 255, 0.05);
      padding: var(--space-md);
      border-radius: var(--radius-md);
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .setting-item label {
      display: block;
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: var(--space-sm);
    }

    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.03);
      border-radius: var(--radius-sm);
      padding: var(--space-xs);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .step-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-base);
    }

    .step-btn:hover:not(:disabled) {
      background: rgba(var(--color-primary-rgb), 0.2);
      border-color: var(--color-primary);
      transform: scale(1.05);
    }

    .step-btn:active:not(:disabled) {
      transform: scale(0.95);
    }

    .step-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .step-value-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .step-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-accent);
      line-height: 1;
    }

    .step-unit {
      font-size: 0.6rem;
      text-transform: uppercase;
      color: var(--color-text-muted);
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .categories-group label {
      display: block;
      font-weight: 600;
      margin-bottom: var(--space-xs);
      font-size: var(--font-size-md);
    }

    .required {
      color: var(--color-error);
    }

    .categories-group .hint {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-md);
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--space-sm);
      max-height: 300px;
      overflow-y: auto;
      padding-right: var(--space-xs);
    }

    .categories-grid::-webkit-scrollbar {
      width: 6px;
    }
    .categories-grid::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    .categories-grid::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
    }

    .category-card {
      background: rgba(0, 0, 0, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-sm);
      padding: var(--space-md);
      cursor: pointer;
      transition: all var(--transition-base);
      user-select: none;
    }

    .category-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .category-card.selected {
      background: rgba(var(--color-primary-rgb), 0.15);
      border-color: var(--color-primary);
    }

    .cat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cat-name {
      font-weight: 500;
      font-size: var(--font-size-sm);
    }

    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-base);
    }

    .category-card.selected .checkbox {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .checkbox span {
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    .setup-actions {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-md);
      margin-top: var(--space-md);
    }
  `]
})
export class GameSetupComponent implements OnInit, OnDestroy {
  readonly GAME_DEFAULTS = GAME_DEFAULTS;
  gameCode = '';

  lobbyState: LobbySnapshot | null = null;
  availableCategories: CategoryDto[] = [];
  selectedCategoryIds = new Set<number>();
  
  // FE-1: Use Signals for interactive state to benefit from fine-grained change detection
  totalRounds = signal<number>(GAME_DEFAULTS.totalRounds);
  timerDuration = signal<number>(GAME_DEFAULTS.timerDuration);
  gameLanguage = signal<string>('en');
  
  loading = true;
  isStarting = false;
  errorMessage = '';


  private destroy$ = new Subject<void>();
  private gameStartedSub: Subject<void> | null = null;

  constructor(
    private playerState: PlayerStateService,
    private gameService: GameService,
    private signalrService: SignalrService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const state = this.playerState.currentState;
    if (!state.gameCode || !state.isHost || !state.userId) {
      this.router.navigate(['/home']);
      return;
    }
    
    this.gameCode = state.gameCode;
    this.loadData();
    this.initializeConnection();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeConnection() {
    this.registerSignalR();
    try {
      await this.signalrService.startConnection();
    } catch (err) {
      this.handleError('Failed to connect to the game server.');
    }
  }

  private loadData() {
    this.loading = true;
    const lang = this.playerState.currentState.language;
    
    // FE-2: Refactor using switchMap to avoid nested subscribes anti-pattern
    this.gameService.getGame(this.gameCode).pipe(
      tap((snapshot) => {
        // Architectural note: Wrapping in zone.run to ensure async stability in complex test scenarios
        this.zone.run(() => {
          this.lobbyState = snapshot;
          // FE-5: Map backend 'totalRounds' (which tracks winning condition/rounds) to local 'totalRounds' signal
          this.totalRounds.set(snapshot.totalRounds);
          this.timerDuration.set(snapshot.timerDuration);
          this.cdr.detectChanges();
        });
      }),
      switchMap(() => {
        return this.gameService.getCategories(lang);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (cats) => {
        this.zone.run(() => {
          this.availableCategories = cats;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.handleError('Failed to load configuration.');
      }
    });
  }

  private registerSignalR() {
    this.gameStartedSub = this.signalrService.on<void>('GameStarted');
    this.gameStartedSub.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.router.navigate(['/game', this.gameCode]);
    });
  }

  toggleCategory(id: number) {
    if (this.selectedCategoryIds.has(id)) {
      this.selectedCategoryIds.delete(id);
    } else {
      this.selectedCategoryIds.add(id);
    }
  }

  updateRounds(delta: number) {
    const newVal = this.totalRounds() + delta;
    if (newVal >= GAME_DEFAULTS.minRounds && newVal <= GAME_DEFAULTS.maxRounds) {
      this.totalRounds.set(newVal);
    }
  }

  updateTimer(delta: number) {
    const newVal = this.timerDuration() + delta;
    if (newVal >= GAME_DEFAULTS.minTimer && newVal <= GAME_DEFAULTS.maxTimer) {
      this.timerDuration.set(newVal);
    }
  }


  setLanguage(lang: string) {
    this.gameLanguage.set(lang);
  }

  onBack() {
    this.router.navigate(['/lobby', this.gameCode]);
  }

  async onStartGame() {
    if (this.selectedCategoryIds.size === 0) return;
    
    this.isStarting = true;
    this.errorMessage = '';
    
    try {
      // 1. Sync all settings to server
      const catArray = Array.from(this.selectedCategoryIds);
      await this.signalrService.invoke('UpdateGameSettings', this.totalRounds(), this.timerDuration(), catArray);
      
      // 1.1 Save locally to state (including game language for dictionary validation)
      this.playerState.updateState({ 
        selectedCategoryIds: catArray,
        totalRounds: this.totalRounds(),
        timerDuration: this.timerDuration(),
        language: this.gameLanguage()
      });
      
      // 2. Start game
      await this.signalrService.invoke('StartGame');
      // FE-3: Reset isStarting on success path to avoid stuck button if navigation is delayed
      this.isStarting = false;
    } catch (err: any) {
      this.zone.run(() => {
        this.errorMessage = err.message || 'Failed to start the game.';
        this.isStarting = false;
        this.cdr.detectChanges();
      });
    }
  }

  private handleError(msg: string) {
    this.zone.run(() => {
      this.errorMessage = msg;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}
