import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { RoundStartedEvent, RoundStoppedEvent, AnswerMap } from '../../models/game.models';
import { CategoryDto } from '../../models/lobby.models';
import { Subscription } from 'rxjs';
import { LetterDisplayComponent } from './letter-display/letter-display.component';

import { CountdownTimerComponent } from './countdown-timer/countdown-timer.component';
import { AnswerGridComponent } from './answer-grid/answer-grid.component';
import { ValidationGridComponent } from './validation-grid/validation-grid.component';
import { RoundResultsComponent } from './round-results/round-results.component';

import { ScoringData, PlayerScore } from '../../models/game.models';


@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LetterDisplayComponent, 
    CountdownTimerComponent, 
    AnswerGridComponent,
    ValidationGridComponent,
    RoundResultsComponent
  ],
  templateUrl: './game.component.html',

  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, OnDestroy {
  // --- Game State Signals ---
  public roundNumber = signal<number>(0);
  public currentLetter = signal<string>('');
  public roundActive = signal<boolean>(false);
  public isLocked = signal<boolean>(false);
  public timerProgress = signal<number>(100);
  public serverTime = signal<string>('');
  public timerDuration = signal<number>(60);
  public gameOverReason = signal<string | null>(null);
  public currentPhase = signal<'playing' | 'validating' | 'results'>('playing');
  
  // --- Phase Data Signals ---
  public scoringData = signal<ScoringData | null>(null);
  public roundScores = signal<PlayerScore[]>([]);
  public isSubmittingValidation = signal<boolean>(false);

  
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
    public router: Router,

    private signalrService: SignalrService,
    public playerState: PlayerStateService,
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

    // Listen for Game Over
    this.subscriptions.push(
      this.signalrService.on<string>('GameOver').subscribe((reason) => {
        this.handleGameOver(reason);
      })
    );

    // Listen for Validation Phase
    this.subscriptions.push(
      this.signalrService.on<ScoringData>('DisplayScoring').subscribe((data) => {
        this.scoringData.set(data);
        this.currentPhase.set('validating');
      })
    );

    // Listen for Results Phase
    this.subscriptions.push(
      this.signalrService.on<PlayerScore[]>('ReceiveGameScore').subscribe((scores) => {
        this.roundScores.set(scores);
        this.currentPhase.set('results');
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
    this.serverTime.set(event.serverTime);
    this.timerDuration.set(event.timerDuration);

    // Ensure we are in playing phase
    this.currentPhase.set('playing');
    this.scoringData.set(null);
    this.roundScores.set([]);
  }


  private async handleRoundStopped(event: RoundStoppedEvent) {
    this.roundActive.set(false);
    this.isLocked.set(true);

    // Reset progress on stop
    this.timerProgress.set(0);

    // Auto-submit answers immediately
    await this.submitAnswers();
    
    // Note: Navigation to scoring will happen in the next Story/Epic
    // For now we stay on this page showing locked answers
    console.log(`Round stopped by ${event.callerNickname}. Answers submitted.`);
  }

  private handleGameOver(reason: string) {
    this.roundActive.set(false);
    this.isLocked.set(true);
    this.gameOverReason.set(reason);
  }


  public onAnswersChanged(updatedAnswers: AnswerMap) {
    this.answers = updatedAnswers;
  }

  public onTimerExpired() {
    if (this.roundActive() && !this.isLocked()) {
      this.roundActive.set(false);
      this.isLocked.set(true);
      this.submitAnswers();
    }
  }

  public async callBasta() {
    if (!this.roundActive() || this.isLocked()) return;
    try {
      await this.signalrService.invoke('CallBasta');
    } catch (err) {
      console.error('Failed to call Basta!', err);
    }
  }

  private async submitAnswers() {
    try {
      await this.signalrService.invoke('SubmitAnswers', this.answers);
    } catch (err) {
      console.error('Failed to submit answers', err);
    }
  }

  public get isRoundRunning(): boolean {
    return this.roundActive() && !this.isLocked();
  }

  public async onValidationSubmitted(validations: { [categoryId: number]: boolean }) {
    try {
      this.isSubmittingValidation.set(true);
      await this.signalrService.submitValidation(validations);
    } catch (err) {
      console.error('Failed to submit validation', err);
      this.isSubmittingValidation.set(false);
    }
  }

  public async startNextRound() {
    try {
      await this.signalrService.invoke('StartRound');
    } catch (err) {
      console.error('Failed to start next round', err);
    }
  }
}

