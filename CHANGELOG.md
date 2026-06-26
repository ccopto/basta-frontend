# Changelog

All notable changes for `ccopto/basta-frontend`.

## Categories

- **Improvements**: user-facing features, Epic functionality, architecture improvements, and new capabilities.
- **Fixes**: bug fixes, security fixes, correctness fixes, and reliability repairs.
- **Patches**: documentation, tests, CI, dependency maintenance, release markers, and other non-feature maintenance work.

## `v1.0.1` - 2026-06-26

Release documentation and generated-artifact ignore maintenance.

**Patches**

- Added the frontend repository changelog.
- Documented release-tag SemVer rules in the frontend agent instructions.
- Ignored live Playwright report and test-result output directories.

## `v1.0.0` - 2026-06-25

Final target release tag for the frontend repository.

**Patches**

- Tagged the final target release on the same commit as `v0.17.2`: `4d2302ce911e0a5429ba41d0a6bf14af0f9fc9fa`.

## `v0.17.2` - 2026-06-25

Frontend code-review fixes and dependency audit cleanup.

**Fixes**

- Rejoined SignalR groups automatically after reconnect.
- Synchronized language and categories across setup, lobby, and gameplay views.
- Restored saved answers from local storage into answer-grid fields.
- Fixed connection status CSS class handling.
- Removed stray template markup.

**Patches**

- Ran npm audit fixes.

## `v0.17.1` - 2026-06-25

Live full-game smoke harness.

**Fixes**

- Fixed validation submission state reset between rounds.
- Updated Playwright to resolve managed-browser install/runtime mismatches.

**Patches**

- Added stable `data-testid` selectors for the full game flow.
- Added a live Playwright config and two-player/two-round smoke test.
- Added live smoke scripts for Chromium, Chrome, Firefox, and WebKit.

## `v0.17.0` - 2026-05-11

Epic 13 dictionary validation UI.

**Improvements**

- Added dictionary-validation fields to frontend models.
- Filtered validation grid to only show answers requiring peer review.
- Added dictionary-validated and peer-review indicators in validation/results flows.
- Added dictionary language selection in game setup.
- Passed game language through create-game requests.

**Patches**

- Added i18n strings and smoke tests for dictionary validation.

## `v0.16.0` - 2026-05-10

Epic 11 frontend security and compliance.

**Fixes**

- Resolved the reported npm vulnerabilities.

**Patches**

- Updated Angular build dependencies.
- Verified `npm audit` was clean in the PR.

## `v0.15.0` - 2026-05-10

Epic 10 frontend testing.

**Patches**

- Added GameSetup boundary tests.
- Added ValidationGrid and RoundResults component specs.
- Added SignalR reconnection and localized-placeholder test coverage.

## `v0.14.0` - 2026-05-10

Epic 8 full localization coverage.

**Improvements**

- Expanded English and Spanish translation files across the game loop.
- Localized Lobby, Game Setup, Game, Validation Grid, Round Results, and Game Over screens.
- Replaced hardcoded strings with translation pipes.

## `v0.13.0` - 2026-05-10

Epic 9 frontend hardening and responsiveness.

**Improvements**

- Added a real-time connection status component.
- Added local storage persistence for round answers.
- Standardized media queries, utility classes, and color tokens.
- Applied responsive design fixes across the main pages.

## `v0.12.0` - 2026-05-10

Epic 8 frontend internationalization foundation.

**Improvements**

- Integrated `@ngx-translate/core`.
- Added English and Spanish translation files.
- Persisted language in player state.
- Localized Home and Game Setup screens.

**Patches**

- Added smoke coverage for language switching and localized categories.

## `v0.11.0` - 2026-05-09

Epic 12 E2E migration to Playwright.

**Patches**

- Migrated E2E tests from Cypress to Playwright.
- Added typed fixtures and helpers for SignalR mocks, session seeding, and API interception.
- Ported smoke tests to Playwright with semantic locators.
- Removed Cypress and updated scripts/CI reporting.

## `v0.10.0` - 2026-05-07

Epic 7 frontend game-over UI.

**Improvements**

- Added leaderboard interfaces.
- Listened for the `GameOver` hub event and navigated to results.
- Added Game Over and Leaderboard components.
- Added podium presentation for top players and list display for the rest.

## `v0.9.0` - 2026-05-03

E2E smoke-test support.

**Patches**

- Added SignalR mock trigger support for non-production E2E testing.
- Added smoke tests for lobby join flow and transition to game page.

## `v0.8.1` - 2026-05-01

Lobby hang and frontend contract fix.

**Fixes**

- Aligned lobby snapshot model fields with the backend.
- Added UI recovery when SignalR updates arrive after initial REST failures.
- Persisted host user ID earlier for responsive UI behavior.
- Stabilized the SignalR event registry for multi-consumer subscriptions.
- Emitted SignalR updates inside `NgZone` for reliable Angular change detection.

## `v0.8.0` - 2026-04-22

Epic 6 frontend scoring and validation.

**Improvements**

- Added scoring DTO models.
- Added validation submission support to the SignalR service.
- Created validation grid and round results components.
- Integrated gameplay, validation, and results phases into the game component.

## `v0.7.0` - 2026-04-22

Epic 5 gameplay UI completion.

**Improvements**

- Refactored gameplay into focused sub-components.
- Added reactive answer grid locking/unlocking.
- Added server-synced countdown timer and letter display overlay.
- Added Game Over event handling.

**Patches**

- Added unit coverage for the new gameplay components.

## `v0.6.0` - 2026-04-21

Game setup and gameplay contract stabilization.

**Improvements**

- Added interactive steppers for rounds and timer duration.
- Wired game settings updates to the unified SignalR hub method.
- Persisted rounds and timer settings in frontend state.
- Simplified gameplay SignalR calls to rely on backend connection context.

**Patches**

- Updated tests for the revised contract.

## `v0.5.0` - 2026-04-18

Frontend quality gates.

**Fixes**

- Fixed a timer-expiry round-state bug.

**Patches**

- Configured Karma for ChromeHeadless.
- Refactored SignalR service for easier HubConnection mocking.
- Added unit coverage for SignalR service, game guard, and game timer/sync behavior.
- Initialized Cypress smoke navigation and gameplay E2E tests.

## `v0.4.0` - 2026-04-18

Epic 5 core gameplay UI.

**Improvements**

- Implemented the active game screen.
- Added animated letter reveal, synchronized countdown, dynamic answer grid, and Basta button.
- Integrated SignalR round start/stop events.
- Added route guard and session category persistence.

## `v0.3.0` - 2026-04-18

Epic 4 frontend game setup.

**Improvements**

- Added guarded Game Setup route.
- Implemented game setup screen for rounds, timer, and categories.
- Added setup state to lobby models and game service.

**Patches**

- Context source: PR title plus Epic 4 user stories and merge diff.

## `v0.2.0` - 2026-04-15

Epic 3 frontend lobby and join flow.

**Improvements**

- Added join-game service methods and DTOs.
- Added Home join form with validation and error handling.
- Added real-time Lobby UI with host/player views.
- Added player list, game code display, lobby update handling, and game-start navigation.

## `v0.1.1` - 2026-04-15

Production environment mapping fix.

**Fixes**

- Added Angular production file replacement so Docker builds use proxy-relative API and hub URLs.
- Fixed browser CORS failures caused by `localhost:5000` in production image builds.

## `v0.1.0` - 2026-04-15

Epic 2 frontend game creation.

**Improvements**

- Added create-game frontend flow.
- Added game and player state services.
- Added lobby guard and routing support.

**Patches**

- Added Cypress coverage for the create-game flow.
- Context source: PR title plus Epic 2 user stories and merge diff.
