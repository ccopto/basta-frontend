# BastaClient

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run the mocked Angular/Playwright suite:

```bash
npm run e2e:ci
```

Run the full-game smoke test against the live Docker Compose stack from the
monorepo root:

```bash
docker compose up -d --build --wait
npm --prefix basta-frontend run e2e:smoke:live
docker compose down
```

The live suite uses two isolated players and completes a two-round game through
Nginx, REST, SignalR, ASP.NET Core, and SQLite. Run one browser project with:

```bash
npm run e2e:smoke:live:chromium
npm run e2e:smoke:live:chrome
npm run e2e:smoke:live:firefox
npm run e2e:smoke:live:webkit
```

Install the managed browser engines once with:

```bash
npx playwright install chromium firefox webkit
```

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
