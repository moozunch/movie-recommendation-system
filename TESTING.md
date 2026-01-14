# movie-recommender-system
Movie recommendation system

## Testing

- Backend: run Pytest inside Docker Compose
	- Start services: `docker compose up -d --build`
	- Run tests: `docker compose exec -T backend pytest`
	- Stop services: `docker compose down`
	- What’s covered:
		- `/` root availability
		- `/search` limits results to 5 (TMDB mocked)
		- `/recommend/v2` for known titles, unknown titles, and empty input
		- `/api/feedback` rejects empty messages; endpoint integrates delivery modes (resend/smtp/file) via helper mocking
		- `/api/feedback/status` reflects environment flags

- Frontend unit (Vitest + RTL)
	- Change into frontend: `cd frontend`
	- Install deps: `npm ci`
	- Run tests: `npm test`
	- Watch mode: `npm run test:watch`
	- What’s covered:
		- `MovieSearch` renders and selects items (debounced fetch mocked)
		- `SelectedMovieCard` renders details and clear behavior

- Frontend E2E (Playwright)
	- Ensure backend is running locally on port 8000
	- In `frontend`, run: `npx playwright test`
