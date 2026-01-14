# movie-recommender-docker
Movie recommendation system with docker

## Testing

- Backend: run Pytest inside Docker Compose
	- Start services: `docker compose up -d --build`
	- Run tests: `docker compose exec -T backend pytest`
	- Stop services: `docker compose down`

- Frontend unit (Vitest + RTL)
	- Change into frontend: `cd frontend`
	- Install deps: `npm ci`
	- Run tests: `npm test`
	- Watch mode: `npm run test:watch`

- Frontend E2E (Playwright)
	- Ensure backend is running locally on port 8000
	- In `frontend`, run: `npx playwright test`
