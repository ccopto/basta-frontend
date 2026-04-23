import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { LobbySnapshot } from '../../models/lobby.models';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lobby-wrapper">
      <div class="glass-card lobby-card animate-scale-in">
        <header class="lobby-header">
          <div class="header-tags">
            <span class="tag lang-tag">{{ lobbyState?.language === 'es' ? 'Español' : 'English' }}</span>
            <span class="tag rounds-tag" *ngIf="lobbyState">🎯 {{ lobbyState.totalRounds }} Rounds</span>
          </div>
          <h1 class="game-code">{{ gameCode }}</h1>
          <p class="subtitle" *ngIf="lobbyState">
            Waiting for players... ({{ lobbyState.players.length }}/5)
          </p>
        </header>

        <section class="players-section">
          <div *ngIf="!lobbyState && !errorMessage" class="loading-state">
            <div class="spinner"></div>
            <p>Connecting to game...</p>
          </div>
          
          <div *ngIf="errorMessage" class="error-msg global-error">
            {{ errorMessage }}
          </div>

          <div class="players-list" *ngIf="lobbyState">
            <div class="player-item hover-scale" 
                 *ngFor="let p of lobbyState.players"
                 [class.is-me]="p.userId === currentUserId"
                 [class.is-offline]="!p.isOnline">
              <div class="avatar" [class.host-avatar]="p.isHost">
                {{ p.nickname.charAt(0).toUpperCase() }}
                <div class="host-crown" *ngIf="p.isHost">👑</div>
              </div>
              <div class="player-details">
                <span class="nickname">{{ p.nickname }}</span>
                <div class="badges">
                  <span class="badge me-badge" *ngIf="p.userId === currentUserId">You</span>
                  <span class="badge offline-badge" *ngIf="!p.isOnline">Offline</span>
                </div>
              </div>
            </div>
            
            <!-- Empty slots -->
            <div class="player-item empty-slot" *ngFor="let _ of emptySlots">
              <div class="avatar empty-avatar">?</div>
              <div class="player-details"><span class="nickname">Waiting...</span></div>
            </div>
          </div>
        </section>

        <footer class="lobby-actions" *ngIf="lobbyState">
          <div *ngIf="isHost" class="host-controls">
            <button class="btn btn-primary btn-block" 
                    [disabled]="lobbyState.players.length < 2" 
                    (click)="onConfigureGame()">
              Configure Game
            </button>
            <p class="hint" *ngIf="lobbyState.players.length < 2">Need at least 2 players to start</p>
          </div>
          
          <div *ngIf="!isHost" class="player-controls">
            <div class="waiting-indicator">
              <span class="pulse"></span>
              <p>Waiting for host to start...</p>
            </div>
          </div>
          
          <button class="btn btn-secondary btn-block leave-btn" (click)="onLeaveLobby()">
            Leave Game
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .lobby-wrapper {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--space-lg);
    }

    .lobby-card {
      width: 100%;
      max-width: 500px;
      padding: var(--space-xl);
    }

    /* Header */
    .lobby-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }

    .header-tags {
      display: flex;
      justify-content: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-md);
    }

    .tag {
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: var(--font-size-xs);
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .game-code {
      font-size: 4rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      margin: 0;
      background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin-top: var(--space-xs);
    }

    /* Players Section */
    .players-section {
      background: rgba(0, 0, 0, 0.15);
      border-radius: var(--radius-md);
      padding: var(--space-md);
      margin-bottom: var(--space-xl);
    }

    .players-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .player-item {
      display: flex;
      align-items: center;
      padding: var(--space-sm);
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-sm);
      transition: background var(--transition-base);
    }
    
    .player-item.is-me {
      background: rgba(var(--color-primary-rgb), 0.15);
      border: 1px solid rgba(var(--color-primary-rgb), 0.3);
    }
    
    .player-item.is-offline {
      opacity: 0.6;
    }

    .empty-slot {
      background: transparent;
      border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .avatar {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--color-surface-lighter);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.25rem;
      font-weight: 700;
      margin-right: var(--space-md);
      border: 2px solid transparent;
    }

    .host-avatar {
      border-color: var(--color-accent);
      background: rgba(var(--color-accent-rgb), 0.1);
    }

    .empty-avatar {
      background: transparent;
      color: var(--color-text-muted);
      border: 2px dashed rgba(255, 255, 255, 0.2);
    }

    .host-crown {
      position: absolute;
      top: -10px;
      right: -5px;
      font-size: 1.2rem;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    }

    .player-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nickname {
      font-weight: 600;
      font-size: var(--font-size-md);
    }
    
    .empty-slot .nickname {
      color: var(--color-text-muted);
      font-style: italic;
    }

    .badges {
      display: flex;
      gap: 6px;
    }

    .badge {
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .me-badge { background: var(--color-primary-dark); color: white; }
    .offline-badge { background: var(--color-error); color: white; }

    /* Actions */
    .lobby-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .btn-block { width: 100%; }

    .hint {
      text-align: center;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      margin-top: var(--space-xs);
    }

    .leave-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      margin-top: var(--space-sm);
    }
    
    .leave-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--color-error);
      color: var(--color-error);
    }

    /* Waiting Indicator */
    .waiting-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      padding: var(--space-sm);
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-sm);
    }

    .waiting-indicator p {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .pulse {
      width: 10px;
      height: 10px;
      background-color: var(--color-primary);
      border-radius: 50%;
      animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }

    @keyframes pulse-ring {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(var(--color-primary-rgb), 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0); }
    }
  `]
})
export class LobbyComponent implements OnInit, OnDestroy {
  gameCode = '';
  currentUserId = 0;
  isHost = false;
  
  lobbyState: LobbySnapshot | null = null;
  errorMessage = '';
  isStarting = false;
  emptySlots: null[] = Array(5).fill(null);

  private destroy$ = new Subject<void>();
  private receiveLobbyUpdateSub: Subject<LobbySnapshot> | null = null;
  private gameStartedSub: Subject<void> | null = null;
  private registeredEvents: string[] = [];

  constructor(
    private playerState: PlayerStateService,
    private signalrService: SignalrService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit() {
    const state = this.playerState.currentState;
    if (!state.gameCode || !state.userId) {
      this.router.navigate(['/home']);
      return;
    }

    this.gameCode = state.gameCode;
    this.currentUserId = state.userId;
    this.isHost = state.isHost;

    this.connectToLobby().catch(err => {
      this.errorMessage = 'Failed to connect to the live lobby. Please try rejoining.';
      console.error(err);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // SignalR events should be unregistered if we don't plan to reuse them
    this.registeredEvents.forEach(e => this.signalrService.off(e));
    this.registeredEvents = [];
  }

  private async connectToLobby() {
    // 1. Initial snapshot fetch to ensure we have data immediately
    this.gameService.getGame(this.gameCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: (snapshot) => {
        this.lobbyState = snapshot;
        this.emptySlots = Array(Math.max(0, 5 - snapshot.players.length)).fill(null);
        this.playerState.updateState({ hostUserId: snapshot.hostUserId });
      },
      error: (err) => {
        console.warn('Could not fetch initial lobby state', err);
        this.errorMessage = 'Could not fetch initial lobby state. Please try refreshing.';
      }
    });

    // 2. Connect SignalR
    await this.signalrService.startConnection();
    
    // 3. Register listeners
    this.receiveLobbyUpdateSub = this.signalrService.on<LobbySnapshot>('ReceiveLobbyUpdate');
    this.registeredEvents.push('ReceiveLobbyUpdate');
    this.receiveLobbyUpdateSub.pipe(takeUntil(this.destroy$)).subscribe(snapshot => {
      this.lobbyState = snapshot;
      this.errorMessage = '';
      this.emptySlots = Array(Math.max(0, 5 - snapshot.players.length)).fill(null);
      this.playerState.updateState({ hostUserId: snapshot.hostUserId });
    });


    this.gameStartedSub = this.signalrService.on<void>('GameStarted');
    this.registeredEvents.push('GameStarted');
    this.gameStartedSub.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.router.navigate(['/game', this.gameCode]);
    });

    // 4. Join the group on HUB
    await this.signalrService.invoke('JoinGame', this.gameCode, this.currentUserId, this.playerState.currentState.nickname);
  }

  onConfigureGame() {
    if (!this.isHost) return;
    this.router.navigate(['/setup', this.gameCode]);
  }

  onLeaveLobby() {
    this.playerState.clearState();
    // Disconnecting SignalR is handled gracefully, or we could explicitly stop it.
    // For now, leaving it up gives quick re-joins, but typically we want to leave the Hub group.
    this.signalrService.stopConnection();
    this.router.navigate(['/home']);
  }
  

}
