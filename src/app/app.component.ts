import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`:host { display: block; min-height: 100vh; }`]
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'es']);
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    // Attach mock globally so Cypress can hook into it
    (window as any).basta_mock_signalr = {
      trigger: (eventName: string, data: any) => {
        console.log(`[SignalR Mock App] Event triggered: ${eventName}`, data);
      }
    };
  }
}
