import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PlayerStateService } from './services/player-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConnectionStatusComponent } from './components/connection-status/connection-status';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConnectionStatusComponent],
  template: `
    <app-connection-status />
    <router-outlet />
  `,
  styles: [`:host { display: block; min-height: 100vh; }`]
})
export class AppComponent {
  constructor(private translate: TranslateService, private playerState: PlayerStateService) {
    this.translate.addLangs(['en', 'es']);
    this.translate.setDefaultLang('en');
    
    // Initial language from state
    this.translate.use(this.playerState.currentState.language);

    // React to language changes in the global state
    this.playerState.state$
      .pipe(takeUntilDestroyed())
      .subscribe(state => {
        if (state.language && this.translate.currentLang !== state.language) {
          this.translate.use(state.language);
        }
      });

    // Attach mock globally so Cypress can hook into it
    (window as any).basta_mock_signalr = {
      trigger: (eventName: string, data: any) => {
        console.log(`[SignalR Mock App] Event triggered: ${eventName}`, data);
      }
    };
  }
}
