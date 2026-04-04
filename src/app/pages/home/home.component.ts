import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="landing">

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content animate-fade-in-up">
          <h1 class="hero-title">
            <span class="hero-accent">¡</span>Basta<span class="hero-accent">!</span>
          </h1>
          <p class="hero-subtitle">Online</p>
          <p class="hero-description">
            The classic word game — now multiplayer. Race to fill categories before someone calls
            <strong>¡Basta!</strong>
          </p>
        </div>
      </section>

      <!-- Status Card -->
      <section class="status-section">
        <div class="glass-card status-card animate-scale-in">
          <h2 class="status-title">🚀 System Status</h2>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-dot online"></span>
              <span class="status-label">Frontend</span>
              <span class="status-value">Angular 21</span>
            </div>
            <div class="status-item">
              <span class="status-dot pending"></span>
              <span class="status-label">Backend</span>
              <span class="status-value">.NET 10</span>
            </div>
            <div class="status-item">
              <span class="status-dot pending"></span>
              <span class="status-label">SignalR</span>
              <span class="status-value">Not Connected</span>
            </div>
            <div class="status-item">
              <span class="status-dot pending"></span>
              <span class="status-label">Database</span>
              <span class="status-value">SQLite</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Preview -->
      <section class="features-section">
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

      <!-- Footer -->
      <footer class="landing-footer">
        <p>Sprint 0 — Project Bootstrapping Complete ✅</p>
      </footer>
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
      padding: var(--space-3xl) 0 var(--space-xl);
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

    /* --- Status Card --- */
    .status-section {
      width: 100%;
      max-width: 600px;
      margin-bottom: var(--space-2xl);
    }

    .status-card {
      text-align: center;
    }

    .status-title {
      font-size: var(--font-size-xl);
      margin-bottom: var(--space-lg);
    }

    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-dot.online {
      background: var(--color-success);
      box-shadow: 0 0 8px var(--color-success);
      animation: pulse 2s infinite;
    }

    .status-dot.pending {
      background: var(--color-warning);
      box-shadow: 0 0 6px var(--color-warning);
    }

    .status-label {
      font-weight: 600;
      font-size: var(--font-size-sm);
      color: var(--color-text);
    }

    .status-value {
      margin-left: auto;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
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

    /* --- Footer --- */
    .landing-footer {
      margin-top: auto;
      padding: var(--space-xl) 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    /* --- Responsive --- */
    @media (max-width: 600px) {
      .status-grid {
        grid-template-columns: 1fr;
      }
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {}
