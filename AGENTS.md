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

### GPG Signing

All commits must be GPG signed. If signing fails, stop and inform the user. Do NOT use the `-c commit.gpgsign=false` override.

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
git commit -m "feat(lobby): add create-game form component"
git commit -m "feat(lobby): wire CreateGame API call in GameService"

# Bad
git commit -m "feat: implement lobby page"  ← too broad
```

### Conventional Commits
`feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`

### Release Tag SemVer Rules

Release tags use SemVer with a `v` prefix: `vX.Y.Z`.

- `X` is the major version. The current final target is `v1.0.0`.
- Before the final target, all project history tags must remain below `v1.0.0`.
- `Y` increments sequentially for feature/epic functionality in chronological merge order. The Epic number is a planning guideline only; do not map Epic numbers directly to minor versions.
- `Z` increments for fixes and maintenance changes, including `fix`, `test`, `chore`, and `docs`.
- If a fix or maintenance PR merges before the first feature/epic tag, use `v0.0.Z`.
- Version each repository independently: parent, backend, and frontend can have different current `0.Y.Z` values.
- Tags should point at the merge commit on `develop` for the PR they represent.
- When the final target is reached, tag the current `develop` commit with both the latest pre-`1.0.0` tag and `v1.0.0`.

---

## Testing Conventions

- Unit tests with **Jasmine + Karma** (Angular default).
- E2E tests with **Playwright** (`e2e/` directory).
- Import `{ test, expect }` from `e2e/fixtures/basta-fixtures.ts`, not from `@playwright/test` directly.
- Use `page.addInitScript()` to seed `sessionStorage` before navigation.
- Use `triggerSignalR(page, eventName, data)` from `e2e/helpers/signalr.ts` to fire mock hub events.
- All API mocking is done via `page.route()`. Reusable mocks live in `e2e/helpers/api-mocks.ts`.

---

## Pre-flight Checks (CRITICAL)

Before pushing any code or creating a PR, the following must be verified locally:

1. `npm run build` must pass (to catch Angular template errors).
2. `npm test` must pass (all unit tests must succeed).
3. `npm run e2e:ci` must pass (all Playwright E2E smoke tests must succeed).
4. `npm run e2e:smoke:live` must pass (all live multi-browser smoke tests must succeed).
