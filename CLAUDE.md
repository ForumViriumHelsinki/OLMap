# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OLMap (Open Logistics Map) is a geospatial web application for collecting and managing logistics-related geographical features (entrances, loading zones, barriers, etc.) for integration with OpenStreetMap. The application uses a Django REST API backend with a React TypeScript frontend.

## Development Commands

Run `just` to see all available commands. Key recipes:

```bash
# Setup
just install           # Install all dependencies (backend + frontend)
cp .env.example .env   # Configure environment (defaults work for local dev)

# Development
just dev               # Start all services with docker-compose (with logs)
just start             # Start services in background
just stop              # Stop services

# Testing
just test              # Run all unit tests (backend + frontend)
just test-backend      # Django tests only
just test-frontend     # Jest tests only
just test-e2e          # Playwright e2e tests (requires running app)

# Code quality
just lint              # Run all linters
just format            # Format all code
just format-check      # Check formatting without changes

# Django management
just manage <command>  # Run Django management commands
just migrate           # Run database migrations
just shell             # Open Django shell
```

### Manual commands (if not using justfile):

**Backend** (from `django_server/`):
```bash
uv sync && uv run python manage.py runserver
```

**Frontend** (from `react_ui/`):
```bash
npm install && npm start
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

See [TESTING.md](docs/TESTING.md) for comprehensive testing guide including:

- Frontend unit tests (Jest + React Testing Library)
- Frontend e2e tests (Playwright)
- Backend tests (Django TestCase)
- Skaffold integration for automated testing

Quick test commands:

```bash
just test-frontend    # Jest unit tests
just test-backend     # Django tests (requires PostgreSQL)
just test-e2e         # Playwright e2e (requires full stack)
```

## Code Quality

- **Backend**: Ruff with max-line-length 120 (see `pyproject.toml`)
- **Frontend**: TypeScript with strict type checking
- **E2E Testing**: Playwright for end-to-end tests
