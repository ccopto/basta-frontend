import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalrService } from '../../services/signalr.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="status-container" *ngIf="(state | async) as s; else noState">
      <div class="status-badge" [ngClass]="s" *ngIf="s !== 'connected'">
        <span class="pulse-dot"></span>
        <span class="status-text">
          {{ 'ERRORS.CONNECTION_' + s.toUpperCase() | translate }}
        </span>
      </div>
    </div>
    <ng-template #noState></ng-template>
  `,
  styles: [`
    .status-container {
      position: fixed;
      top: var(--space-md);
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      pointer-events: none;
      animation: slideDown 0.3s ease-out;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-lg);
      font-size: var(--font-size-sm);
      font-weight: 600;
    }
    .status-badge.reconnecting { border-color: var(--color-warning); color: var(--color-warning); }
    .status-badge.reconnecting .pulse-dot { background: var(--color-warning); }
    .status-badge.disconnected { border-color: var(--color-error); color: var(--color-error); }
    .status-badge.disconnected .pulse-dot { background: var(--color-error); }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }
  `],
})
export class ConnectionStatusComponent {
  private signalr = inject(SignalrService);
  public state = this.signalr.connectionState$;
}
