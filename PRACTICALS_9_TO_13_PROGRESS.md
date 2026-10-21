# Practicals 9–13 Progress

This log records changes made for Practicals 9–13, commands actually run, verification results, manual steps, and known limitations. The referenced Practical List PDF was not present in the repository or its parent folder, and no PDF was listed in the parent ZIP archive; the detailed requirements supplied in the task prompt are being used.

## Repository baseline

- Frontend: React 19 with Vite, at the repository root.
- Backend: CommonJS Express 5 API in `task-manager-api`, using Mongoose and JWT authentication.
- Existing working-tree changes were present in `src/App.jsx`, `task-manager-api/package.json`, `task-manager-api/package-lock.json`, and `task-manager-api/server.js`; these were inspected and are being preserved.
- `task-manager-api/.env` is ignored by Git. Its contents were not read or printed.
- No existing test files or Docker/Compose files were found during initial inventory.
- Runtime observed: Node.js v24.15.0 and npm 11.12.1. Docker CLI was not available.

## Practical 9 — In-memory caching and query optimization

**Status: Complete**

- Reviewed the existing 60-second NodeCache implementation, which keys task lists by authenticated user, sets `X-Cache`/`X-Response-Time-Ms`, and invalidates on successful task writes.
- Added HTTP integration tests using Node's built-in test runner. They check cache HIT/MISS, user isolation, and invalidation after create/update/delete.
- Added a backend `npm test` script and made the Express app importable for tests without starting a database connection on import.
- Removed a stray trailing Markdown fence in the pre-existing edited `server.js` that caused a syntax error and prevented the API module from loading.

**Commands run:** `npm test` from `task-manager-api` (first run exposed the malformed trailing fence; second run passed).

**Verification:** `npm test` passed: 2 tests, 2 passed, 0 failed. Tests use actual HTTP requests/auth middleware and stub only Mongoose model operations; no database credentials or external MongoDB were required.

**Manual steps:** Collect real uncached and cached request timings and fill the comparison table in `PRACTICALS_9_TO_13_RECORD.md`.

**Known limitations:** Cache is process-local and is cleared on API restart; it is not a distributed cache.

## Practical 10 — Event-driven asynchronous processing

**Status: Complete**

- Added a built-in `EventEmitter` for `task-created` and `task-deleted`; events are emitted only after successful Mongoose create/delete operations.
- Event listeners defer logging with `setImmediate` and include task title, an ISO timestamp, and assigned user ID. They do not use the special `error` event.
- Added an HTTP test for both event logs and successful create/delete responses.

**Commands run:** `npm test` from `task-manager-api`.

**Verification:** Passed: 3 tests, 3 passed, 0 failed. The test observed create/delete event log records while receiving successful API responses.

**Manual steps:** None for this practical.

## Practical 11 — Docker and Docker Compose

**Status: Implemented; Docker validation blocked by environment**

- Added production frontend and backend Dockerfiles, Docker ignore rules, Nginx SPA fallback, and Compose orchestration for frontend/API/MongoDB.
- Compose uses `mongo` as the API's database hostname, includes MongoDB/API health checks, and persists MongoDB data in `mongodb_data`.
- Added a root `.env.example` with placeholders and documented local Compose commands. Both root and backend `.env` files are ignored by Git.

**Commands run:** `docker compose config` (attempted); `git check-ignore .env task-manager-api/.env`.

**Verification:** Ignore check confirmed both local env files are ignored. Docker Compose config could not run because the Docker CLI is not installed. No standalone YAML parser was available, so Compose YAML has not been machine-validated; Docker images were not built or started.

**Manual steps:** Install/start Docker Desktop, copy `.env.example` to `.env`, set a unique `JWT_SECRET`, run `docker compose config`, then `docker compose up --build`.

**Known limitations:** Container build, startup, health checks, and browser/API connectivity remain unverified in this environment.

## Practical 12 — GitHub Actions CI/CD

**Status: Implemented; GitHub-hosted run pending**

- Added a `main` push/pull-request workflow using Node.js 22, `npm ci` for both lockfiles, the frontend production build, and the backend's real automated API tests.
- Added the CI status badge using the existing repository URL in `README.md`.

**Commands run:** Root `npm ci`, `npm run lint`, `npm run build`, backend `npm ci`, `npm test`, and `npm audit --omit=dev`.

**Verification:** Frontend production build passed. Backend `npm test` passed: 3 tests, 3 passed, 0 failed. Production dependency audit found 0 vulnerabilities. The frontend `npm run lint` command failed on existing React effect lint findings in `Login.jsx`, `Project.jsx`, and `TaskManager.jsx`, an unused assignment in `src/services/api.js`, and CommonJS globals not configured for backend files; the workflow runs the production build and backend tests instead of the currently failing whole-workspace lint command. `npm ci` reported 3 high-severity advisories across the full frontend dependency tree.

**Known limitations:** No YAML-specific validator was available. GitHub Actions execution requires a push/PR to the repository.

## Practical 13 — AI API integration

**Status: Complete; live provider call not verified**

- Added authenticated backend endpoint `POST /ai/task-suggestion`, using OpenAI Chat Completions with only the validated task title in the user payload.
- Added 120-character input limit, 15-second request timeout, structured provider error handling, response validation, and backend environment variable placeholders.
- Added the Task Manager suggestion control, loading/error/result states, title privacy warning, and review disclaimer.
- Added mocked-provider tests for missing configuration, valid output, provider outage, title-only payload, and CRUD availability.

**Commands run:** Backend `npm test`, `node --check server.js`, and root `npm run build`.

**Verification:** Latest backend suite passed: 6 tests, 6 passed, 0 failed. Node syntax check passed. Frontend production build passed. Provider tests are mocked; no live OpenAI call was made.

**Manual steps:** Add an OpenAI key to the backend `.env`, restart the API, then test the live suggestion UI. Do not expose the key in frontend configuration or screenshots.

**Known limitations:** Live provider account/key and external network behavior remain unverified.

## Final verification and remaining work

**Commands run and observed results:**

- Root `npm ci`: completed; npm reported 3 high-severity advisories in the full dependency tree.
- Backend `npm ci`: completed.
- `npm run build`: passed after the AI UI was added.
- Backend `npm test`: passed, 6 tests, 6 passed, 0 failed.
- `node --check server.js`: passed.
- Root `npm run lint`: failed on existing React-effect, unused-assignment, and CommonJS-global lint findings; CI does not use this currently failing lint command.
- `npm audit --omit=dev`: passed with 0 production dependency vulnerabilities.
- `docker compose config`: attempted but unavailable because Docker CLI is not installed; no image/stack was run.
- `git check-ignore .env task-manager-api/.env`: confirmed both local env files are ignored.

**Manual work still required:** Docker validation/build/start; GitHub-hosted failed-then-passing Actions runs; live OpenAI configuration and request; three real cached/uncached MongoDB timing pairs; practical evidence screenshots.

**Known limitations:** Practical List PDF was unavailable in the repository, parent folder, and parent ZIP archive. No screenshots were created. Performance readings and live AI output remain intentionally blank/unverified.

**Files added or updated for Practicals 9–13:** `.dockerignore`, `.env.example`, `Dockerfile`, `PRACTICALS_9_TO_13_PROGRESS.md`, `PRACTICALS_9_TO_13_RECORD.md`, `README.md`, `docker-compose.yml`, `nginx.conf`, `.github/workflows/ci.yml`, `src/index.css`, `src/pages/TaskManager.jsx`, `src/services/api.js`, `task-manager-api/.dockerignore`, `task-manager-api/.env.example`, `task-manager-api/Dockerfile`, `task-manager-api/package.json`, `task-manager-api/server.js`, `task-manager-api/test/server.test.js`.

Pre-existing dirty files `src/App.jsx` and `task-manager-api/package-lock.json` were not reverted or overwritten. The backend package file was already modified before this task; the `test` script was added to that existing version.
