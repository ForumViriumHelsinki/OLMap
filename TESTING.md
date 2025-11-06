# OLMap Testing Guide

This document describes how to run tests for the OLMap project across different components and environments.

## Test Types

### 1. Frontend Unit Tests (Jest)
**Location:** `react_ui/src/**/*.test.js`
**Framework:** Jest + React Testing Library
**Dependencies:** None (runs standalone)

```bash
# Run all unit tests
cd react_ui && npm test -- --watchAll=false

# Or use Make
make test-frontend
```

### 2. Frontend E2E Tests (Playwright)
**Location:** `react_ui/e2e/**/*.spec.ts`
**Framework:** Playwright
**Dependencies:** Requires full stack running (frontend + backend)

```bash
# Option 1: With Skaffold running
# Terminal 1:
skaffold dev

# Terminal 2:
make test-e2e

# Option 2: Direct execution
cd react_ui && ./run-e2e-tests.sh

# Option 3: Headed mode (see browser)
cd react_ui && npm run test:e2e:headed

# Option 4: Interactive UI mode
cd react_ui && npm run test:e2e:ui
```

### 3. Backend Tests (Django)
**Location:** `django_server/olmap/**/*.py`
**Framework:** Django TestCase
**Dependencies:** Requires PostgreSQL running

```bash
# Start PostgreSQL first
brew services start postgresql
# or
docker compose up -d postgres

# Run tests
cd django_server && DJANGO_DEBUG=true uv run python manage.py test

# Or use Make
make test-backend
```

## Testing with Skaffold

### Quick Start

```bash
# Start the full stack with port-forwarding
skaffold dev

# In another terminal, run e2e tests
make test-e2e
```

### Skaffold Test Integration

The project includes Skaffold integration for automated testing:

#### Standard Workflow (Recommended)

```bash
# Terminal 1: Start Skaffold (deploys app with port-forwards)
skaffold dev

# Terminal 2: Wait for services to be ready, then run tests
make test-e2e
```

#### With Verify Profile (Advanced)

For CI/CD or automated testing in containers:

```bash
# Deploy and verify in one command
skaffold run -p with-tests

# Or for continuous development with verification
skaffold dev -p with-tests
```

The `with-tests` profile runs Playwright tests in a containerized environment after deployment.

## Environment Configuration

### Playwright Base URL

The Playwright tests use the `BASE_URL` environment variable:

```bash
# Default: http://localhost:3000
npm run test:e2e

# Custom URL
BASE_URL=http://custom-host:8080 npm run test:e2e
```

### Admin Credentials

Login tests use environment variables for credentials:

```bash
# Default values
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin

# Custom credentials
ADMIN_USERNAME=myuser ADMIN_PASSWORD=mypass npm run test:e2e
```

## Continuous Integration

For CI/CD pipelines, use this sequence:

```bash
# 1. Start services with Docker Compose or Kubernetes
docker compose up -d

# 2. Wait for services to be ready
./react_ui/run-e2e-tests.sh  # Includes wait logic

# 3. Run tests
cd react_ui && npm run test:e2e

# 4. Cleanup
docker compose down
```

Or with Skaffold:

```bash
# Build, deploy, and test
skaffold run -p with-tests

# Cleanup
skaffold delete
```

## Test Results and Artifacts

### Playwright Reports

After test execution:

```bash
# View HTML report
npm run test:e2e:report
```

Reports are generated in:
- `react_ui/playwright-report/` - HTML report
- `react_ui/test-results/` - Screenshots and traces
- Test failures include automatic screenshots

### Test Debugging

```bash
# Run with debugger
npx playwright test --debug

# Generate test code interactively
npx playwright codegen http://localhost:3000

# View trace of failed test
npx playwright show-trace react_ui/test-results/trace.zip
```

## Troubleshooting

### E2E Tests Fail with "Failed to fetch"

**Problem:** Frontend can't connect to backend API
**Solution:** Ensure backend is running and accessible:

```bash
# Check if backend is responding
curl http://localhost:8000/rest-auth/user/

# Verify Skaffold port-forwards are active
skaffold dev  # should show port-forward status
```

### Backend Tests Fail with "Connection refused"

**Problem:** PostgreSQL is not running
**Solution:** Start PostgreSQL:

```bash
# macOS with Homebrew
brew services start postgresql

# Or use Docker
docker compose up -d postgres

# Verify it's running
psql -U postgres -c "SELECT version();"
```

### Playwright Tests Timeout

**Problem:** Application not ready when tests start
**Solution:** The test script includes wait logic, but you can increase timeouts:

```typescript
// In playwright.config.ts
export default defineConfig({
  timeout: 60000,  // Increase from 30000
  // ...
});
```

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::3000`
**Solution:** Kill existing process or reuse the server:

```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or configure Playwright to reuse existing server
# (already configured in playwright.config.ts)
```

## Best Practices

1. **Run unit tests before e2e tests** - Faster feedback loop
2. **Use `skaffold dev`** for development - Automatic rebuilds
3. **Use `make test-e2e`** for manual testing - Simpler than remembering paths
4. **Check screenshots on failure** - Saved in `test-results/`
5. **Use headed mode for debugging** - `npm run test:e2e:headed`
6. **Keep tests independent** - Don't rely on execution order
7. **Clean up test data** - Use test database or cleanup hooks

## Quick Reference

```bash
# All test commands at a glance
make help                    # Show available test targets
make test-frontend           # Jest unit tests
make test-backend           # Django tests (needs PostgreSQL)
make test-e2e               # Playwright e2e (needs full stack)
make test-all               # All unit tests (not e2e)

# Skaffold workflows
skaffold dev                # Develop with hot-reload
skaffold run                # One-time deploy
skaffold run -p with-tests  # Deploy + verify tests
skaffold delete             # Cleanup deployment
```
