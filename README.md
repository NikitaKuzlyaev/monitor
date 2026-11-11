# HackIT Monitor

Live dashboard for the HackIT programming contest. The application displays event screens, cached Codeforces standings and submissions, and lets an authorised operator update the event state.

## Stack

- React and Vite frontend
- FastAPI backend
- Redis for shared state and the Codeforces cache
- Docker Compose for local and production-like runs

## Quick start

1. Copy `.env.example` to `.env` and set a strong `APP_ADMIN_CODE`.
2. Run `docker compose up --build`.
3. Open `http://localhost`.

The API documentation is available at `http://localhost/docs`. The backend is intentionally not published on a host port; requests go through the web container.

## Local development

Start Redis with `docker compose up redis`, then run the API with `uvicorn backend.server.app:app --reload` and the frontend with `npm run dev` in `frontend/`. For the API outside Docker, set `REDIS_KV_SIMPLE_CACHE_HOST=localhost` in `.env`.

Run checks from the repository root:

```bash
python -m pip install -r requirements-dev.txt
python -m pytest
ruff check .
cd frontend && npm ci && npm run lint && npm run build
```

## Configuration

All supported variables are documented in `.env.example`. Do not commit `.env` files. `CODEFORCES_API_KEY` and `CODEFORCES_API_SECRET` are optional: public contest endpoints work without them.

## Administrator panel

Open page `8` in the dashboard and sign in with `APP_ADMIN_CODE`. A successful login creates one active browser session in Redis; signing in from another browser invalidates the previous session. Set `ADMIN_COOKIE_SECURE=true` when the application is served over HTTPS.

The panel also controls the Codeforces contest ID and refresh interval, plus the frontend timeout for `staff` requests.

## Project layout

```text
backend/
  api/             HTTP routes and dependency wiring
  codeforces/      Codeforces client and response mapping
  configuration/   typed application settings
  redis_storage/   Redis adapter
  services/        application use cases and state
frontend/          React application
tests/             backend tests
```

## Security

If this repository was ever pushed with real credentials, revoke and replace them before making it public. Removing a key from the latest commit does not remove it from Git history.

## License

Choose and add a license before publishing. A repository without a license does not grant reuse rights.
