# Movie Recommendation System

Full-stack web app for movie discovery and explainable recommendations. The frontend is built with Next.js, and the backend is a FastAPI service that ingests TMDB data and computes content-based similarities using TF–IDF.

## Overview

- Explainable recommendations based on plot and genre similarity.
- Live search powered by TMDB.
- Clean UI with accessible components.
- Integration tests (Playwright) and unit tests (Vitest, Pytest).
- CI pipeline runs backend + frontend unit tests on every push/PR.

## Architecture

- **Frontend**: Next.js 16 (React 19), TypeScript, Tailwind CSS, Radix UI components.
	- Key components: [frontend/components/movie-search.tsx](frontend/components/movie-search.tsx), [frontend/components/selected-movie-card.tsx](frontend/components/selected-movie-card.tsx).
	- Debounced search via [frontend/lib/hooks/useDebounce.ts](frontend/lib/hooks/useDebounce.ts).

- **Backend**: FastAPI + httpx, scikit-learn TF–IDF for vectorizing movie features.
	- Startup loads ~50 pages of TMDB popular movies and builds a TF–IDF matrix.
	- Lifespan-based initialization avoids deprecated startup events.

- **Data Source**: TMDB API (requires `TMDB_TOKEN`).

- **CI**: GitHub Actions
	- Unit pipeline: [ .github/workflows/ci-test.yml ](.github/workflows/ci-test.yml)
	- E2E pipeline: [frontend/.github/workflows/playwright.yml](frontend/.github/workflows/playwright.yml)

## Repository Layout

```
backend/
	Dockerfile
	main.py
	requirements.txt
	test_app.py
frontend/
	Dockerfile
	package.json
	vitest.config.ts
	tests/
		movie.spec.ts           # Playwright E2E
		unit/
			movie-search.test.tsx # Vitest unit
README.md
docker-compose.yml
.github/workflows/
	ci-test.yml
```

## Backend API

- **GET /**
	- Health/info: returns `{ message }` indicating readiness.

- **GET /search?query=Inception**
	- Calls TMDB and returns up to 5 results in `{ results }`.

- **POST /recommend/v2**
	- Body: `{ "titles": ["Inception", "Interstellar"] }`
	- Returns `{ user_profile, recommendations }` where each recommendation includes `title`, `year`, `rating`, `genres`, `poster_path`, `reason`, `match_score`.

- **POST /api/feedback**
	- Body: `{ "email": "user@example.com", "message": "..." }`
	- Attempts delivery via Resend (HTTPS) or SMTP; falls back to local log file.

- **GET /api/feedback/status**
	- Returns flags indicating configured delivery transports.

### Quick API Examples

```bash
# Search
curl 'http://localhost:8000/search?query=Inception'

# Recommend
curl -X POST 'http://localhost:8000/recommend/v2' \
	-H 'Content-Type: application/json' \
	-d '{"titles":["Inception","Interstellar"]}'

# Feedback
curl -X POST 'http://localhost:8000/api/feedback' \
	-H 'Content-Type: application/json' \
	-d '{"email":"user@example.com","message":"Great app!"}'
```

## Configuration

### Backend `.env`

Create [backend/.env](backend/.env):

```env
TMDB_TOKEN=your_tmdb_bearer_token
# Optional feedback delivery
RESEND_API_KEY=your_resend_key
RESEND_FROM=noreply@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=user
SMTP_PASSWORD=pass
SMTP_USE_TLS=true
FEEDBACK_RECIPIENT=maintainer@example.com
```

### Frontend `.env.local`

Create [frontend/.env.local](frontend/.env.local):

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Running Locally

### With Docker Compose

```bash
docker compose up -d --build
# Frontend at http://localhost:3000
# Backend at http://localhost:8000
```

Stop:

```bash
docker compose down
```

### Without Docker (dev mode)

- Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- Frontend:

```bash
cd frontend
npm ci
npm run dev
```

## Testing

- **Backend (Pytest)**
	- Start services: `docker compose up -d --build`
	- Run: `docker compose exec -T backend pytest`
	- Stop: `docker compose down`
	- Coverage:
		- `/` root availability
		- `/search` limits results to 5 (TMDB mocked)
		- `/recommend/v2` for known titles, unknown titles, and empty input
		- `/api/feedback` rejects empty messages; endpoint integrates delivery modes (resend/smtp/file) via helper mocking
		- `/api/feedback/status` reflects environment flags

- **Frontend Unit (Vitest + RTL)**
	- `cd frontend && npm ci && npm test`
	- Watch: `npm run test:watch`
	- Coverage:
		- `MovieSearch` renders and selects items (debounced fetch mocked)
		- `SelectedMovieCard` renders details and clear behavior

- **Frontend E2E (Playwright)**
	- Ensure backend running on `http://localhost:8000`
	- `cd frontend && npx playwright test`

## CI/CD

- Unit Tests Workflow: [ .github/workflows/ci-test.yml ](.github/workflows/ci-test.yml)
	- Jobs:
		- `test-backend`: builds containers and runs backend Pytest.
		- `test-frontend-unit`: sets up Node, caches dependencies, runs Vitest.
		- `all-checks`: depends on both unit jobs.
	- Concurrency enabled to cancel in-progress runs for the same branch.

- E2E Workflow: [frontend/.github/workflows/playwright.yml](frontend/.github/workflows/playwright.yml)
	- Installs browsers and runs Playwright tests.

## Notes and Limitations

- Backend startup downloads TMDB popular titles and builds the model; first run may take time and requires `TMDB_TOKEN`.
- In CI, network access to TMDB is not required for tests because calls are mocked.
- Use `NEXT_PUBLIC_BACKEND_URL` to point the frontend to your backend when deploying.

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file included in the repository.
