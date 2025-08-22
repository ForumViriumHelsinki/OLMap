# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OLMap (Open Logistics Map) is a geospatial web application for collecting and managing logistics-related geographical features (entrances, loading zones, barriers, etc.) for integration with OpenStreetMap. The application uses a Django REST API backend with a React TypeScript frontend.

## Development Commands

### Backend (Django) - from `django_server/` directory:

```bash
pipenv install          # Install dependencies
pipenv shell           # Activate virtual environment
python manage.py migrate              # Run migrations
python manage.py runserver           # Start dev server (port 8000)
flake8                  # Lint Python code (configured in tox.ini)
python manage.py test   # Run Django tests
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

## Code Quality

- **Backend**: flake8 with max-line-length 120
- **Frontend**: TypeScript with strict type checking
- Tests: Django test suite + React Testing Library
