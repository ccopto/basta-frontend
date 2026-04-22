import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timer-section">
      <div class="timer-bar-container">
        <div class="timer-bar" [style.width.%]="timerProgress()"></div>
      </div>
      <span class="timer-text">{{ timeRemainingText() }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .timer-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
    .timer-bar-container {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .timer-bar {
      height: 100%;
      background: var(--color-primary);
      transition: width 0.1s linear;
    }
    .timer-text {
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      text-align: right;
    }
  `]
})
export class CountdownTimerComponent implements OnChanges, OnDestroy {
  @Input() serverTime: string = '';
  @Input() durationSec: number = 60;
  @Input() isLocked: boolean = false;
  
  @Output() expired = new EventEmitter<void>();

  public timerProgress = signal<number>(100);
  public timeRemainingText = signal<string>('00:00');

  private timerSubscription?: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['serverTime'] || changes['durationSec']) && this.serverTime) {
      this.startSyncedTimer();
    }
    if (changes['isLocked'] && this.isLocked) {
      this.stopTimer();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startSyncedTimer() {
    this.stopTimer();
    
    const startTime = new Date(this.serverTime).getTime();
    const endTime = startTime + (this.durationSec * 1000);

    this.updateTimer(endTime);

    this.timerSubscription = interval(100).subscribe(() => {
      this.updateTimer(endTime);
    });
  }

  private updateTimer(endTime: number) {
    const now = Date.now();
    const remainingMs = Math.max(0, endTime - now);
    const remainingSec = Math.ceil(remainingMs / 1000);
    
    const progress = (remainingMs / (this.durationSec * 1000)) * 100;
    this.timerProgress.set(progress);
    
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    this.timeRemainingText.set(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

    if (remainingMs <= 0) {
      this.stopTimer();
      this.expired.emit();
    }
  }

  private stopTimer() {
    this.timerSubscription?.unsubscribe();
  }
}
