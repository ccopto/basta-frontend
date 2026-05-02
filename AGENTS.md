# AGENTS.md — Basta! Frontend

This file is read by all AI coding agents (Antigravity, Claude Code, OpenCode, etc.) working on this repository.
For project-wide conventions, also see [AGENTS.md in the monorepo](https://github.com/ccopto/basta).

---

## Stack

- **Angular 21** (Standalone Components)
- **TypeScript** (strict mode)
- **SignalR** client (`@microsoft/signalr`) for real-time game events
- **ngx-translate** for i18n (Spanish + English)
- **Vanilla CSS** (no Tailwind)

---

## macOS Environment Quirks

### Node / npm

Node is installed via Homebrew. If `node` or `npm` is not found on PATH, try:
```bash
/usr/local/bin/node
/opt/homebrew/bin/node
```

### Git GPG Signing Is Broken

Always commit with:
```bash
git -c commit.gpgsign=false commit -m "..."
```

---

## Architecture Rules

### Component Design
- Use **Standalone Components** exclusively (no NgModules).
- Keep components focused and small — extract shared UI into `shared/components/`.
- All API interactions go through **typed services** in `core/services/`.

### API Contracts
- All API calls must use **strictly-typed interfaces** matching backend DTOs.
- Never use `any`. Define an interface in `core/models/` for every request/response shape.
- The backend base URL is configured via environment files (`environment.ts` / `environment.prod.ts`).

### Real-Time (SignalR)
- SignalR client code lives in a dedicated `GameHubService`.
- All hub events must be typed — define a `HubEvent` interface for each server event.

### Styling
- Use **Vanilla CSS** — no Tailwind, no UI frameworks unless explicitly approved.
- Follow mobile-first, responsive design. The game is primarily played on mobile.
- Rich aesthetics: use CSS custom properties for the design system, smooth transitions, and micro-animations.

---

## Git Workflow

### Branch Strategy
```
master    ← production
develop   ← integration (PRs target this)
feature/* ← short-lived
```

### ⚠️ Atomic Commits — CRITICAL
One commit per logical change. Never batch unrelated changes into a single commit.

```bash
# Good
git -c commit.gpgsign=false commit -m "feat(lobby): add create-game form component"
git -c commit.gpgsign=false commit -m "feat(lobby): wire CreateGame API call in GameService"

# Bad
git -c commit.gpgsign=false commit -m "feat: implement lobby page"  ← too broad
```

### Conventional Commits
`feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`

---

## Testing Conventions

- Unit tests with **Jasmine + Karma** (Angular default).
- Test each service and component in isolation using `TestBed` and `HttpClientTestingModule`.
- For SignalR: mock the `HubConnection` in service tests.

---

## Pre-flight Checks (CRITICAL)

Before pushing any code or creating a PR, the following must be verified locally:

1. `npm run build` must pass (to catch Angular template errors).
2. `npm test` must pass (all unit tests must succeed).
3. `npm run e2e:ci` must pass (all E2E smoke tests must succeed).
