# Prachi Patoliya — AWDF Portfolio

[![CI](https://github.com/24dce109-crypto/awdf-prachi/actions/workflows/ci.yml/badge.svg)](https://github.com/24dce109-crypto/awdf-prachi/actions/workflows/ci.yml)

A college-level React portfolio and task manager for Advanced Web Development Frameworks practicals 1–13.

## Stack
- React + Vite
- React Router
- GitHub REST API
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs

## Local development

From the repository root, install and start the frontend:

```bash
npm ci
npm run dev
```

In a second terminal, set up the backend:

```powershell
cd task-manager-api
npm ci
Copy-Item .env.example .env
```

Edit `task-manager-api/.env` with a MongoDB connection string and a unique `JWT_SECRET`, then start the API:

```bash
npm run dev
```

Frontend: http://localhost:5173

Backend: http://localhost:5000

### Environment variable names

Backend `.env` variables: `MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`.

Docker Compose root `.env` variables: `JWT_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `MONGO_HOST_PORT`, `API_HOST_PORT`, `FRONTEND_HOST_PORT`, `VITE_API_URL`, `CLIENT_URL`. Copy `.env.example` to `.env` and replace the placeholder JWT secret. Never commit either `.env` file.

### Tests and production build

```bash
# From task-manager-api
npm test

# From the repository root
npm run build
```

The backend tests use Node's built-in test runner and stub Mongoose operations; they do not require a live MongoDB server or AI account. `npm run lint` is available, but currently reports existing React-effect, unused-assignment, and CommonJS-global lint findings; the CI workflow gates the production build and backend tests instead.

### Optional AI suggestions

The protected `POST /ai/task-suggestion` endpoint uses OpenAI from the backend only. Set `OPENAI_API_KEY` in `task-manager-api/.env` (and optionally `OPENAI_MODEL`), restart the API, and use the suggestion button in the Task Manager. The title is the only task data sent to the provider. If no key is configured or the provider is unavailable, task CRUD remains usable.

## Docker Compose

Install Docker Desktop (including Docker Compose), then from the repository root:

```powershell
Copy-Item .env.example .env
```

Edit the local `.env` file and replace `JWT_SECRET` with a unique random secret. Do not commit `.env`. Then build and start the stack:

```powershell
docker compose config
docker compose up --build
```

Open the frontend at http://localhost:8080. The API is available at http://localhost:5000. Compose connects the API to MongoDB using the `mongo` service hostname and stores database files in the named `mongodb_data` volume. To stop the services while preserving database data, run `docker compose down`.

## GitHub Actions

The `CI` workflow runs on pushes and pull requests targeting `main`. It installs both projects from their lockfiles, builds the frontend, and runs the backend tests. To observe both a failed and passing run without leaving the project broken, work on a feature branch and open a pull request: temporarily change a backend test assertion so it fails, push and confirm the failed workflow, then restore the correct assertion, push again, and confirm the passing workflow. Do not make the intentionally failing change directly on `main`.

## Practical mapping

- Practicals 1–7: React portfolio, REST API, MongoDB/Mongoose CRUD, JWT authentication and validation.
- Practical 9: per-user in-memory task cache and query timing headers.
- Practical 10: asynchronous task-created/task-deleted event logging.
- Practical 11: Docker images and Compose for frontend, API, and MongoDB.
- Practical 12: GitHub Actions CI workflow and backend HTTP tests.
- Practical 13: optional, backend-only AI task-description/priority suggestion.

See [PRACTICALS_9_TO_13_RECORD.md](./PRACTICALS_9_TO_13_RECORD.md) for procedures, evidence checklist, and the unfilled performance comparison table.
GitHub repository: https://github.com/24dce109-crypto/awdf-prachi
