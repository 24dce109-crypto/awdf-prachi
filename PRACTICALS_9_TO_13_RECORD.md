# Practicals 9–13 Record

This record reflects work and checks actually completed in this environment. The referenced Practical List PDF was not found in the repository or its parent folder, and no PDF was listed in the parent ZIP archive; the practical objectives provided in the task prompt were followed. No screenshots have been captured. Evidence items below are for the student to collect from real runs.

## Practical 9 — In-memory caching and query optimization

### Aim

Reduce repeated task-list database reads while ensuring cached task data stays isolated by authenticated user and invalidates after successful writes.

### Requirements

- NodeCache with a 60-second TTL.
- User-scoped GET `/tasks` cache, HIT/MISS headers, and protected diagnostics.
- Cache invalidation after successful POST, PUT, and DELETE operations.
- Repeatable real-request performance measurements.

### Procedure

1. Authenticate as a user and request `GET /tasks`; note `X-Cache: MISS` and `X-Response-Time-Ms`.
2. Request the same endpoint again; note `X-Cache: HIT`.
3. Create, update, or delete a task and request the list again; the next GET should be a MISS.
4. Authenticate as a different user and verify their list and cache key remain independent.
5. Repeat uncached/cached requests against the real local database and record the response-time header below.

### Key code/files

- `task-manager-api/server.js`: per-user cache, TTL, response headers, diagnostics, and write invalidation.
- `task-manager-api/test/server.test.js`: HTTP tests for HIT/MISS, user isolation, and create/update/delete invalidation.
- `task-manager-api/package.json`: `npm test` script.

### Actual output and evidence

- Verified: backend test suite passed with cache HIT/MISS, user isolation, and all three write invalidations.
- Automated tests stub Mongoose model calls, so their response timings are not performance measurements and are intentionally not copied into the table.
- **Student evidence placeholder:** capture the first GET response (`X-Cache: MISS`), the repeated GET (`X-Cache: HIT`), the next GET after a write (`MISS`), and separate-user output.

### Performance comparison — fill only with real measurements

Use the same account, task dataset, API process, and machine for each pair. Clear the current user's cache with authenticated `DELETE /cache` before each uncached sample; immediately repeat GET `/tasks` for its cached sample. Record the actual `X-Response-Time-Ms` values.

| Sample | Uncached GET (ms) | Cached GET (ms) | Uncached header | Cached header | Notes |
|---|---:|---:|---|---|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |

### Result

Cache behavior is verified by automated HTTP tests. No real MongoDB performance readings have been collected; the table remains blank for measurement during the student's local run. Cache contents are process-local and are cleared when the API restarts.

### Viva questions

1. Why must the cache key include the authenticated user ID?
2. When should a task-list cache be invalidated?
3. What are the limitations of an in-memory cache when an application runs on multiple API instances?

## Practical 10 — Asynchronous processing with EventEmitter

### Aim

Decouple task lifecycle logging from HTTP request handling using Node.js's built-in event system.

### Requirements

- Emit `task-created` only after successful database creation.
- Emit `task-deleted` only after successful deletion.
- Log task title, timestamp, and assigned user asynchronously.
- Avoid an unhandled special `error` event.

### Procedure

1. Start the API and authenticate.
2. Create a task and confirm the HTTP response succeeds.
3. Inspect the API terminal for the `task-created` event log.
4. Delete the task and inspect the terminal for `task-deleted`.

### Key code/files

- `task-manager-api/server.js`: EventEmitter, deferred log listener, and emits after successful create/delete operations.
- `task-manager-api/test/server.test.js`: verifies event log fields and successful HTTP responses.

### Actual output and evidence

Observed automated test output included event lines with event name, title, ISO timestamp, and test user ID, for example `[EVENT] task-created | title="Created task" | time=2026-10-21T16:38:06.668Z | user=test-user-a`.

**Student evidence placeholder:** capture the actual API terminal and successful create/delete responses from a local run.

### Result

Create/delete event logging and API response paths passed the backend automated test. Event handlers schedule logging with `setImmediate` and do not await slow work in the request handler.

### Viva questions

1. What is the benefit of event-driven processing?
2. Why is the event emitted only after the database operation succeeds?
3. Why should an EventEmitter `error` event be handled specially?

## Practical 11 — Docker and Docker Compose

### Aim

Containerize the production frontend and backend and orchestrate them with MongoDB.

### Requirements

- Production frontend build served by Nginx.
- Backend and MongoDB services with service-name networking.
- Health checks and persistent MongoDB volume.
- Secrets supplied at runtime, not baked into images.

### Procedure

1. Install and start Docker Desktop.
2. Copy root `.env.example` to `.env`; replace `JWT_SECRET` with a unique secret.
3. Run `docker compose config`.
4. Run `docker compose up --build` and verify the frontend and API health.
5. Stop using `docker compose down`; confirm the named MongoDB volume persists.

### Key code/files

- `Dockerfile`, `nginx.conf`, `.dockerignore`: frontend build and Nginx SPA serving.
- `task-manager-api/Dockerfile`, `task-manager-api/.dockerignore`: API image and build exclusions.
- `docker-compose.yml`: frontend/API/MongoDB services, health checks, and volume.
- `.env.example`: local Compose variable placeholders.

### Actual output and evidence

- `docker compose config` was attempted but could not execute because the Docker CLI is not installed in this environment.
- No image was built, container started, or Compose health check observed.

**Student evidence placeholder:** capture successful Compose config, `docker compose ps`, frontend in browser, API health endpoint, and the MongoDB named volume.

### Result

Container and Compose configuration files were added, but runtime behavior remains unverified pending Docker Desktop.

### Viva questions

1. Why does the API use `mongo` rather than `localhost` for its database hostname inside Compose?
2. What is the purpose of a named volume?
3. Why should secrets be passed through environment variables instead of copied into an image?

## Practical 12 — CI/CD with GitHub Actions

### Aim

Run reproducible frontend build and backend API tests for pushes and pull requests targeting `main`.

### Requirements

- GitHub Actions workflow, lockfile-based dependency installation, suitable Node version, and a real test.
- Observe a failed run and a subsequent passing run without leaving the project broken.

### Procedure

1. Push a feature branch and open a pull request targeting `main`.
2. Inspect the `CI` workflow run and its frontend-build/backend-test steps.
3. To observe failure, temporarily alter a test assertion on the feature branch, push, and inspect the failed run.
4. Restore the correct assertion, push again, and inspect the passing run.

### Key code/files

- `.github/workflows/ci.yml`: Node.js 22, reproducible installs, frontend build, and backend tests.
- `task-manager-api/test/server.test.js`: executable HTTP tests used by CI.
- `README.md`: CI badge and failure/recovery instructions.

### Actual output and evidence

- Local workflow-equivalent checks: frontend production build passed; backend tests passed (6 tests, 6 passed, 0 failed).
- No workflow has been run on GitHub from this environment. A remote red/green run has not been observed.

**Student evidence placeholder:** capture the GitHub Actions failed run after the temporary test break, then the passing run after restoring the test.

### Result

The workflow is implemented and local build/test commands pass. GitHub-hosted execution remains pending a push or pull request.

### Viva questions

1. Why does CI use `npm ci` when lockfiles are available?
2. What is the difference between a push trigger and a pull-request trigger?
3. How do automated tests help prevent regressions?

## Practical 13 — AI API integration

### Aim

Offer an optional AI-generated task description and priority suggestion without exposing the provider key or making task CRUD depend on AI availability.

### Requirements

- Authenticated backend-only OpenAI request using only a validated title.
- Timeout, provider-error handling, and structured result.
- Frontend loading/result/error states and review disclaimer.
- Core CRUD available without provider credentials.

### Procedure

1. For a live provider check, set `OPENAI_API_KEY` in backend `.env` and restart the API.
2. Log in and open the Task Manager.
3. Enter a task title and click **Suggest description + priority**.
4. Review/edit the suggested description and priority before creating the task.
5. Without a key or during provider outage, verify the error is visible and task CRUD remains available.

### Key code/files

- `task-manager-api/server.js`: authenticated `/ai/task-suggestion` route, title limit, timeout, provider checks, and response validation.
- `task-manager-api/.env.example` and root `.env.example`: provider variable names/placeholders.
- `src/services/api.js`: authenticated frontend API helper.
- `src/pages/TaskManager.jsx` and `src/index.css`: suggestion controls and UI states.
- `task-manager-api/test/server.test.js`: mocked provider success/outage, title validation, and CRUD independence.

### Actual output and evidence

- Verified with mocked provider responses only. Automated tests confirmed a structured suggestion, missing-key response, provider-error response, title-only provider payload, and continued task creation.
- **No live OpenAI request was made.** A real API key/account is required for live provider evidence.

**Student evidence placeholder:** capture the successful suggestion and disclaimer using a configured key, then capture the readable unavailable/error state without exposing the key.

### Result

The optional integration is implemented and tested without a live provider. CRUD remains functional when the AI key is missing or the mocked provider returns an error.

### Viva questions

1. Why must an AI provider key remain on the backend?
2. Why is a timeout necessary for external API calls?
3. Why should users review AI-generated task suggestions?

## Evidence checklist

- [ ] Practical 9: authenticated GET response with `X-Cache: MISS`.
- [ ] Practical 9: repeated GET with `X-Cache: HIT`.
- [ ] Practical 9: cache miss after each successful create/update/delete; separate-user isolation.
- [ ] Practical 9: fill all three uncached/cached measurements using a real local database.
- [ ] Practical 10: API terminal create and delete event logs with matching successful responses.
- [ ] Practical 11: valid Compose config, running containers, frontend/API checks, and persistent database volume.
- [ ] Practical 12: GitHub Actions failed run after a temporary test failure, followed by a passing run after repair.
- [ ] Practical 13: live suggestion result and review disclaimer; also capture missing-key/provider-error behavior.

No evidence screenshots have been generated by the assistant.
