# Justfile for OLMap (Open Logistics Map)
# Run `just` or `just help` to see available recipes

set dotenv-load
set positional-arguments

# Default recipe - show help
default:
    @just --list

# Show available recipes with descriptions
help:
    @just --list --unsorted

####################
# Development
####################

# Start all services with docker-compose
start:
    docker-compose up -d

# Stop all services
stop:
    docker-compose down

# Start services and follow logs
dev:
    docker-compose up

# View logs from all services
logs *args:
    docker-compose logs {{ args }}

# Run Django management commands
manage *args:
    cd django_server && uv run python manage.py {{ args }}

# Open Django shell
shell:
    cd django_server && uv run python manage.py shell

# Run database migrations
migrate:
    cd django_server && uv run python manage.py migrate

# Create new migration
makemigrations *args:
    cd django_server && uv run python manage.py makemigrations {{ args }}

####################
# Testing
####################

# Run all tests (backend + frontend unit tests)
test: test-backend test-frontend

# Run Django backend tests (requires database - use `just db` first)
test-backend:
    @echo "Running Django backend tests..."
    cd django_server && SQL_HOST=localhost DJANGO_DEBUG=true uv run python manage.py test

# Start only the database (for running tests locally)
db:
    docker-compose up -d db
    @echo "Waiting for database to be ready..."
    @until docker-compose exec -T db pg_isready -U ${POSTGRES_USER:-olmap} 2>/dev/null; do sleep 1; done
    @echo "Database is ready"

# Stop the database
db-stop:
    docker-compose stop db

# Run frontend unit tests (Jest)
test-frontend:
    @echo "Running frontend unit tests..."
    cd react_ui && npm test -- --watchAll=false --passWithNoTests

# Run Playwright e2e tests (requires app running on localhost:3000)
test-e2e:
    @echo "Running Playwright E2E tests..."
    cd react_ui && ./run-e2e-tests.sh

# Run e2e tests in headed mode (visible browser)
test-e2e-headed:
    cd react_ui && npm run test:e2e:headed

# Run e2e tests with Playwright UI
test-e2e-ui:
    cd react_ui && npm run test:e2e:ui

# Show Playwright test report
test-e2e-report:
    cd react_ui && npm run test:e2e:report

####################
# Linting & Formatting
####################

# Run all linters
lint: lint-backend lint-frontend

# Lint Python backend with ruff
lint-backend:
    cd django_server && uv run ruff check .

# Lint frontend (TypeScript check)
lint-frontend:
    cd react_ui && npx tsc --noEmit

# Format all code
format: format-backend format-frontend

# Format Python backend with ruff
format-backend:
    cd django_server && uv run ruff format .
    cd django_server && uv run ruff check --fix .

# Format frontend with biome
format-frontend:
    cd react_ui && npm run format

# Check formatting without making changes
format-check: format-check-backend format-check-frontend

# Check Python formatting
format-check-backend:
    cd django_server && uv run ruff format --check .
    cd django_server && uv run ruff check .

# Check frontend formatting
format-check-frontend:
    cd react_ui && npm run format:check

####################
# Build
####################

# Build all containers
build:
    docker-compose build

# Build frontend for production
build-frontend:
    cd react_ui && npm run build

# Build backend container only
build-backend:
    docker-compose build web

####################
# Dependencies
####################

# Install all dependencies
install: install-backend install-frontend

# Install backend dependencies
install-backend:
    cd django_server && uv sync

# Install frontend dependencies
install-frontend:
    cd react_ui && npm install

# Update backend dependencies
update-backend:
    cd django_server && uv lock --upgrade

# Update frontend dependencies
update-frontend:
    cd react_ui && npm update

####################
# Cleanup
####################

# Clean all build artifacts and caches
clean: clean-backend clean-frontend clean-docker

# Clean Python artifacts
clean-backend:
    find django_server -type f -name "*.pyc" -delete
    find django_server -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    rm -rf django_server/.pytest_cache django_server/.ruff_cache django_server/.coverage
    rm -rf django_server/htmlcov django_server/*.egg-info

# Clean frontend artifacts
clean-frontend:
    rm -rf react_ui/build react_ui/node_modules/.cache
    rm -rf react_ui/test-results react_ui/playwright-report react_ui/playwright/.cache

# Clean docker volumes (WARNING: removes database data)
clean-docker:
    docker-compose down -v

####################
# Skaffold (Local K8s)
####################

# Run with skaffold for local Kubernetes development
skaffold-dev:
    skaffold dev

# Run skaffold with e2e tests
skaffold-test:
    skaffold dev --profile=with-tests

# Build with skaffold
skaffold-build:
    skaffold build

####################
# Utilities
####################

# Check if services are healthy
health:
    @echo "Checking service health..."
    @docker-compose ps
    @echo ""
    @curl -s http://localhost:8000/health/ && echo " Backend OK" || echo " Backend not responding"
    @curl -s http://localhost:3000/ > /dev/null && echo " Frontend OK" || echo " Frontend not responding"

# Create a superuser for Django admin
createsuperuser:
    cd django_server && uv run python manage.py createsuperuser

# Collect static files
collectstatic:
    cd django_server && uv run python manage.py collectstatic --noinput
