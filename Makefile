.PHONY: help test-e2e test-backend test-frontend test-all

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

test-e2e: ## Run Playwright e2e tests (requires app to be running on localhost:3000)
	@echo "Running Playwright E2E tests..."
	cd react_ui && ./run-e2e-tests.sh

test-frontend: ## Run frontend unit tests (Jest)
	@echo "Running frontend unit tests..."
	cd react_ui && npm test -- --watchAll=false --passWithNoTests

test-backend: ## Run Django backend tests (requires PostgreSQL)
	@echo "Running Django backend tests..."
	cd django_server && DJANGO_DEBUG=true uv run python manage.py test

test-all: test-frontend test-backend ## Run all tests (unit tests only, not e2e)
	@echo "All unit tests completed!"
