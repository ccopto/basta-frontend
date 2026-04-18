import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { RoundStartedEvent, RoundStoppedEvent, AnswerMap } from '../../models/game.models';
import { CategoryDto } from '../../models/lobby.models';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  // --- Game State Signals ---
  public roundNumber = signal<number>(0);
  public currentLetter = signal<string>('');
  public roundActive = signal<boolean>(false);
  public isLocked = signal<boolean>(false);
  public timerProgress = signal<number>(100); // 0 to 100 for the bar
  public timeRemainingText = signal<string>('00:00');
  
  // --- Answer Grid State ---
  public categories = signal<CategoryDto[]>([]);
  public answers: AnswerMap = {};
  
  // --- UI/Animation Signals ---
  public showLetterOverlay = signal<boolean>(false);
  
  private gameCode: string = '';
  private timerSubscription?: Subscription;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signalrService: SignalrService,
    private playerState: PlayerStateService,
    private gameService: GameService
  ) {}

  async ngOnInit() {
    this.gameCode = this.route.snapshot.paramMap.get('code') || '';
    const state = this.playerState.currentState;

    if (!this.gameCode || !state.userId) {
      this.router.navigate(['/home']);
      return;
    }

    // 1. Prepare Category Names
    this.loadCategories(state.selectedCategoryIds);

    // 2. Setup SignalR Listeners
    this.setupSignalR();

    // 3. Connect (session should already be active or will be on RoundStarted)
    await this.signalrService.startConnection();
    
    // 4. Optimization: Only join if we haven't already (prevents spurious broadcasts)
    if (this.signalrService.currentGameCode !== this.gameCode) {
      await this.signalrService.invoke('JoinGame', this.gameCode, state.userId, state.nickname);
      this.signalrService.currentGameCode = this.gameCode;
    }
  }

  ngOnDestroy() {
    this.stopTimer();
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private loadCategories(selectedIds: number[]) {
    if (selectedIds && selectedIds.length > 0) {
      this.gameService.getCategories().subscribe(allCats => {
        const filtered = allCats.filter(c => selectedIds.includes(c.categoryId));
        this.categories.set(filtered);
        filtered.forEach(c => this.answers[c.categoryId] = '');
      });
    } else {
      // Fallback: If not in local state (joined player), fetch from server snapshot
      this.gameService.getGame(this.gameCode).subscribe(game => {
        if (game && game.selectedCategoryIds) {
          this.gameService.getCategories().subscribe(allCats => {
            const filtered = allCats.filter(c => game.selectedCategoryIds.includes(c.categoryId));
            this.categories.set(filtered);
            filtered.forEach(c => this.answers[c.categoryId] = '');
          });
        }
      });
    }
  }

  private setupSignalR() {
    // Listen for round start
    this.subscriptions.push(
      this.signalrService.on<RoundStartedEvent>('RoundStarted').subscribe((event) => {
        this.handleRoundStarted(event);
      })
    );

    // Listen for round stop (Basta! or Timer Over)
    this.subscriptions.push(
      this.signalrService.on<RoundStoppedEvent>('RoundStopped').subscribe((event) => {
        this.handleRoundStopped(event);
      })
    );
  }

  private handleRoundStarted(event: RoundStartedEvent) {
    this.roundNumber.set(event.roundNumber);
    this.currentLetter.set(event.letter);
    this.roundActive.set(true);
    this.isLocked.set(false);
    
    // Trigger Letter Overlay Animation
    this.showLetterOverlay.set(true);
    setTimeout(() => this.showLetterOverlay.set(false), 2500);

    // Start Timer with Server Sync
    this.startSyncedTimer(event.serverTime, event.timerDuration);
  }

  private async handleRoundStopped(event: RoundStoppedEvent) {
    this.roundActive.set(false);
    this.isLocked.set(true);
    this.stopTimer();

    // Auto-submit answers immediately
    await this.submitAnswers();
    
    // Note: Navigation to scoring will happen in the next Story/Epic
    // For now we stay on this page showing locked answers
    console.log(`Round stopped by ${event.callerNickname}. Answers submitted.`);
  }

  private startSyncedTimer(serverTimeIso: string, durationSec: number) {
    this.stopTimer();
    
    const startTime = new Date(serverTimeIso).getTime();
    const endTime = startTime + (durationSec * 1000);

    this.timerSubscription = interval(100).subscribe(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, endTime - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      
      const progress = (remainingMs / (durationSec * 1000)) * 100;
      this.timerProgress.set(progress);
      
      const mins = Math.floor(remainingSec / 60);
      const secs = remainingSec % 60;
      this.timeRemainingText.set(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

      if (remainingMs <= 0) {
        this.stopTimer();
      }
    });
  }

  private stopTimer() {
    this.timerSubscription?.unsubscribe();
  }

  public async callBasta() {
    if (!this.roundActive() || this.isLocked()) return;
    try {
      await this.signalrService.invoke('CallBasta', this.gameCode);
    } catch (err) {
      console.error('Failed to call Basta!', err);
    }
  }

  private async submitAnswers() {
    try {
      await this.signalrService.invoke('SubmitAnswers', this.gameCode, this.answers);
    } catch (err) {
      console.error('Failed to submit answers', err);
    }
  }

  public get isRoundRunning(): boolean {
    return this.roundActive() && !this.isLocked();
  }
}
