---
project_name: 'release-concert-calendar'
user_name: 'Robin'
date: '2026-06-27'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 38
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project. Focuses on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Electron** `^33.0.0` — desktop shell, `electron/main.js` entry point (CommonJS)
- **Node.js + Express** `^4.18.2` — backend at `backend/`, pure ESM (`"type": "module"`)
- **Angular** `^21.1.0` — frontend at `frontend/`, standalone components; builder is `@angular/build` (not legacy `@angular-devkit/build-angular`)
- **TypeScript** `~5.9.2` — strict mode + `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- **Tailwind CSS** `^3.4.1` — all styling; no Angular Material used anywhere
- **RxJS** `~7.8.0` — HTTP client and SSE event streams
- **music-metadata** `^9.0.0` — audio file tag reading (backend only)
- **axios** `^1.6.0` — HTTP client (backend only)
- **cheerio** `^1.2.0` — Songkick HTML scraping
- **node-cron** `^4.2.1` — background cron jobs for release/concert sync
- **vitest** `^4.0.8` — frontend test runner

---

## Critical Implementation Rules

### Language-Specific Rules

**Module system — mixed in one repo, never cross the streams:**
- `backend/` is pure ESM: use `import`/`export` only — `require()` throws `ReferenceError` at runtime
- `electron/main.js` is CommonJS: use `require()` only — no `import` statements
- To load the ESM backend from Electron, use dynamic `await import(\`file://${backendPath}\`)` — follow the existing pattern in `main.js`

**TypeScript (frontend):**
- `strictTemplates: true` — HTML bindings are type-checked; types must match exactly
- `isolatedModules: true` — no `const enum`; every file must compile independently

**Import/Export:**
- Backend: named exports only (`export function foo()`), no default exports
- Frontend: path-relative imports only (no path aliases configured)

**Error Handling:**
- Backend route handlers: `try/catch` → `console.error()` + `res.status(500).json({ error: ... })`
- `database.js` read functions: return empty `[]` or `{}` on error, never throw
- Frontend `subscribe()`: always include an `error` callback — no silent failures

### Framework-Specific Rules

**Angular — Standalone Components:**
- All components use `standalone: true`; no NgModules exist — never create one
- Each component declares its own `imports: []` array with exactly what it uses
- New app-level providers go in `app.config.ts` (`provideRouter`, `provideHttpClient`, etc.)

**Angular — State with Signals:**
- Pages use `signal<T>()` for reactive state, not class properties or BehaviorSubjects
- Write: `this.loading.set(true)` / Read: `this.loading()` (invoked as a function)
- Derived values use `get` getters currently — not `computed()` signals

**Angular — HTTP via ApiService:**
- All backend calls go through `src/app/services/api.service.ts` — components never use `HttpClient` directly
- Every new backend endpoint needs a corresponding method in `ApiService`
- `API_URL` auto-detects environment: port `4200` → `http://localhost:3000/api`, else `window.location.origin/api`

**Angular — SSE Real-time Updates:**
- `ApiService.listenToEvents()` wraps `EventSource` in an RxJS Observable
- Components: subscribe in `ngOnInit`, store as `private sseSub?: Subscription`, unsubscribe in `ngOnDestroy`
- Callbacks inside `EventSource` use `NgZone.run()` to re-enter Angular change detection — always preserve this

**Express Backend — Structure:**
- Routes in `backend/routes/`, business logic in `backend/services/`
- New resource = new route file + new service file + mount in `server.js` at `/api/<resource>`
- Real-time events flow through named `EventEmitter` instances (`cronEmitter`, `concertCronEmitter`, `scanEmitter`) wired into the `/api/events` SSE endpoint in `server.js`

**Data Storage:**
- All JSON reads/writes go through `backend/services/database.js` — no other file touches data files directly
- Data path comes from `process.env.DATA_DIR` (injected by Electron); never hardcode `backend/data/`
- Each entity (artists, releases, concerts, settings) has its own JSON file and dedicated load/save functions

### Testing Rules

- **Runner**: Vitest `^4.0.8` (frontend only); no backend test framework exists
- **Run**: `cd frontend && npm test`
- **File naming**: `name.component.spec.ts` co-located next to the file under test
- **Component tests**: `TestBed.configureTestingModule({ imports: [StandaloneComponent] })` — standalone import pattern, not `declarations`
- **HTTP mocking**: use `HttpClientTestingModule` for services that use `ApiService`
- No coverage thresholds; tests are not CI-enforced
- Backend tests: if adding, introduce Vitest or `node:test` as a separate setup

### Code Quality & Style Rules

**Formatting:**
- Prettier in `frontend/package.json`: `printWidth: 100`, `singleQuote: true`, HTML parser `"angular"`
- No linter or formatter on the backend

**Naming:**
- Angular: `kebab-case` directory, `PascalCase` class, `app-` selector prefix
- Component files: `name.component.ts` / `.html` / `.css` (two legacy exceptions exist — follow `.component.ts` for new files)
- Backend files: `camelCase.js`
- Shared TypeScript interfaces live in `api.service.ts` — add new ones there

**Code Organization:**
- No barrel `index.ts` files — import directly from source files
- Frontend: reusable UI → `components/`; route views → `pages/`; HTTP → `services/`
- Backend: thin route handlers in `routes/`; logic in `services/`; all persistence in `database.js`
- No comments or JSDoc; backend debug output uses `console.log` with `[Tag]` prefixes

### Development Workflow Rules

**Build & Run:**
- Full dev cycle: `npm run electron:dev` (root) — builds frontend, then launches Electron
- Frontend only: `cd frontend && npm start` (port 4200, hot reload)
- Backend only: `cd backend && npm start`
- Electron loads `frontend/dist/` — always build frontend before running Electron
- Production: `npm run electron:build:linux` or `npm run electron:build:mac`

**Data Files:**
- `backend/data/*.json` are gitignored — runtime user data, never commit populated files
- Defaults are copied to `app.getPath('userData')/data` on first Electron launch via `copyDefaultData()`

**Electron Packaging:**
- `asar: false` in electron-builder — required so the backend can use `fs` at runtime
- `DATA_DIR` = `app.getPath('userData')/data` in production; design all data logic to work in both dev and packaged modes
- Linux requires `--no-sandbox` (already set in `main.js`)

**Git:** single `main` branch, short lowercase commit messages, no CI pipeline.

### Critical Don't-Miss Rules

**Hard Anti-Patterns:**
- Never `require()` in `backend/` — ESM, throws at runtime
- Never `import` in `electron/main.js` — CommonJS; use dynamic `await import()` only when loading ESM
- Never access data files directly — all persistence through `database.js`
- Never hardcode `backend/data/` — always use `process.env.DATA_DIR`
- Never create an `NgModule` — fully standalone Angular architecture
- Never call `HttpClient` from a component — always through `ApiService`
- Never omit `.error` in `subscribe()` — silent HTTP failures are a real bug

**Non-Obvious Edge Cases:**
- `ApiService` detects env via `window.location.port === '4200'` — keep Angular dev server on port 4200 or API calls break
- `database.js` `saveArtists()` cascades deletes — removing artists also purges their releases and concerts
- MusicBrainz: **1.2s** rate limit; Songkick: **2s** rate limit — always use the existing `rateLimit()` helpers
- SSE: unsubscribe the RxJS `Subscription`, not the `EventSource` — the Observable teardown handles `eventSource.close()`
- Songkick is scraped HTML, not an official API — can break silently if their markup changes

**Architecture Boundaries:**
- No auth layer by design — local-only Electron app; don't add auth complexity
- CORS is wide open intentionally — do not restrict without understanding the Electron IPC model

---

## Usage Guidelines

**For AI Agents:** Read this file before implementing any code. Follow all rules exactly. When in doubt, match the existing patterns in the codebase.

**For Humans:** Update when the technology stack or conventions change. Keep it lean — remove rules that become obvious over time.

_Last Updated: 2026-06-27_
