# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OLMap (Open Logistics Map) is a geospatial web application for collecting and managing logistics-related geographical features (entrances, loading zones, barriers, etc.) for integration with OpenStreetMap. The application uses a Django REST API backend with a React TypeScript frontend.

## Development Commands

### Backend (Django) - from `django_server/` directory:

```bash
uv sync                # Install dependencies
uv run python manage.py migrate      # Run migrations
uv run python manage.py runserver   # Start dev server (port 8000)
uv run flake8          # Lint Python code (configured in pyproject.toml)
uv run python manage.py test        # Run Django tests
```

### Frontend (React) - from `react_ui/` directory:

```bash
npm install            # Install dependencies
npm start              # Start dev server (port 3000)
npm run build          # Production build
npm test               # Run React tests
```

### Docker Development:

```bash
docker-compose up      # Starts web (Django), db (Postgres), frontend (React)
```

## Architecture

### Backend (Django)

- Django REST Framework with PostgreSQL
- Core models: `OSMImageNote`, `MapFeature`, `OSMFeature`, `Address`
- API in `django_server/olmap/rest/`

### Frontend (React + TypeScript)

- Main routes: `/login/`, `/ww/`, `/Notes/`, `/note/:noteId`
- Components organized by feature in `react_ui/src/components/`
- Context-based state management
- Leaflet + React-Leaflet for mapping

## Testing

See [TESTING.md](TESTING.md) for comprehensive testing guide including:

- Frontend unit tests (Jest + React Testing Library)
- Frontend e2e tests (Playwright)
- Backend tests (Django TestCase)
- Skaffold integration for automated testing

Quick test commands:

```bash
make test-frontend    # Jest unit tests
make test-backend     # Django tests (requires PostgreSQL)
make test-e2e         # Playwright e2e (requires full stack)
```

## Code Quality

- **Backend**: Ruff with max-line-length 120 (see `pyproject.toml`)
- **Frontend**: TypeScript with strict type checking
- **E2E Testing**: Playwright for end-to-end tests
