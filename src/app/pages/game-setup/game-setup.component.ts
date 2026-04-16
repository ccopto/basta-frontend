import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GameService } from '../../services/game.service';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { CategoryDto, LobbySnapshot } from '../../models/lobby.models';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="setup-wrapper">
      <div class="glass-card setup-card animate-scale-in">
        <header class="setup-header">
          <h1 class="game-code">{{ gameCode }}</h1>
          <h2>Game Setup</h2>
          <p class="subtitle">Configure the categories for this match.</p>
        </header>

        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading configuration...</p>
        </div>

        <div *ngIf="errorMessage" class="error-msg global-error">
          {{ errorMessage }}
        </div>

        <form class="setup-form" *ngIf="!loading && lobbyState">
          <!-- Readonly Settings -->
          <div class="settings-grid">
            <div class="setting-item">
              <label>Target Score (Rounds)</label>
              <div class="readonly-value">{{ lobbyState.targetScore }} pts</div>
            </div>
            <div class="setting-item">
              <label>Timer Duration</label>
              <div class="readonly-value">{{ lobbyState.timerDuration }} sec</div>
            </div>
          </div>

          <!-- Categories -->
          <div class="form-group categories-group">
            <label>Select Categories <span class="required">*</span></label>
            <p class="hint">Choose at least one category for the game.</p>
            
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
              Back to Lobby
            </button>
            <button type="button" class="btn btn-primary btn-block" 
                    [disabled]="selectedCategoryIds.size === 0 || isStarting" 
                    (click)="onStartGame()">
              {{ isStarting ? 'Starting...' : 'Start Game' }}
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
      margin-bottom: var(--space-xs);
    }

    .readonly-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-accent);
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
  gameCode = '';
  lobbyState: LobbySnapshot | null = null;
  availableCategories: CategoryDto[] = [];
  selectedCategoryIds = new Set<number>();
  
  loading = true;
  isStarting = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();
  private gameStartedSub: Subject<void> | null = null;

  constructor(
    private playerState: PlayerStateService,
    private gameService: GameService,
    private signalrService: SignalrService,
    private router: Router
  ) {}

  ngOnInit() {
    const state = this.playerState.currentState;
    if (!state.gameCode || !state.isHost || !state.userId) {
      this.router.navigate(['/home']);
      return;
    }
    
    this.gameCode = state.gameCode;
    this.loadData();
    this.initializeConnection(state.userId, state.nickname);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalrService.off('GameStarted');
  }

  private async initializeConnection(userId: number, nickname: string) {
    try {
      await this.signalrService.startConnection();
      await this.signalrService.invoke('JoinGame', this.gameCode, userId, nickname);
      this.registerSignalR();
    } catch (err) {
      this.handleError('Failed to connect to the game server.');
    }
  }

  private loadData() {
    this.loading = true;
    
    const lang = 'en'; // Hardcoded till language selection in Epic 5
    
    this.gameService.getGame(this.gameCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: (snapshot) => {
        this.lobbyState = snapshot;
        
        this.gameService.getCategories(lang).pipe(takeUntil(this.destroy$)).subscribe({
          next: (cats) => {
            this.availableCategories = cats;
            this.loading = false;
          },
          error: () => this.handleError('Failed to load categories.')
        });
      },
      error: () => this.handleError('Failed to load game config.')
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

  onBack() {
    this.router.navigate(['/lobby', this.gameCode]);
  }

  async onStartGame() {
    if (this.selectedCategoryIds.size === 0) return;
    
    this.isStarting = true;
    this.errorMessage = '';
    
    try {
      // 1. Send categories to server
      const catArray = Array.from(this.selectedCategoryIds);
      await this.signalrService.invoke('SetCategories', catArray);
      
      // 2. Start game
      await this.signalrService.invoke('StartGame');
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to start the game.';
      this.isStarting = false;
    }
  }

  private handleError(msg: string) {
    this.errorMessage = msg;
    this.loading = false;
  }
}
