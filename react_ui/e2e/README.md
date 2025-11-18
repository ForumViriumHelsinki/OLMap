# End-to-End Tests for OLMap

This directory contains Playwright end-to-end tests for the OLMap frontend application.

## Prerequisites

- Node.js and npm installed
- Playwright dependencies installed (`npx playwright install chromium`)
- Backend server running (for integration tests)

## Running Tests

### Run all tests (headless mode)

```bash
npm run test:e2e
```

### Run tests with browser visible (headed mode)

```bash
npm run test:e2e:headed
```

### Run tests with interactive UI mode

```bash
npm run test:e2e:ui
```

### View last test report

```bash
npm run test:e2e:report
```

### Run specific test file

```bash
npx playwright test e2e/login.spec.ts
```

## Test Files

### `page-load.spec.ts`

Basic tests to verify the application loads correctly:

- Home page loads successfully
- Logo and heading are visible
- Login/Register options are displayed

### `login.spec.ts`

Tests for authentication functionality:

- Login form elements are displayed
- Admin login with valid credentials
- Error handling for invalid credentials
- Toggle between login and register modes

## Configuration

### Admin Credentials

The login tests use environment variables for credentials:

```bash
ADMIN_USERNAME=your_admin_username ADMIN_PASSWORD=your_admin_password npm run test:e2e
```

Default values (for local testing):

- `ADMIN_USERNAME`: `admin`
- `ADMIN_PASSWORD`: `admin`

### Test Configuration

The test configuration is defined in `playwright.config.ts`:

- Base URL: `http://localhost:3000`
- Browser: Chromium
- Automatic dev server startup
- Screenshots on failure
- Trace on first retry

## Writing New Tests

When adding new tests:

1. Create a new `.spec.ts` file in the `e2e/` directory
2. Import the Playwright test framework:
   ```typescript
   import { test, expect } from "@playwright/test";
   ```
3. Use descriptive test names and group related tests with `test.describe()`
4. Follow existing patterns for page interactions and assertions

## Debugging Tests

### Run with debugger

```bash
npx playwright test --debug
```

### Generate test code

```bash
npx playwright codegen http://localhost:3000
```

### View trace viewer

After a test failure, open the trace viewer:

```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

The tests are configured to:

- Run in headless mode on CI
- Retry failed tests twice on CI
- Use a single worker on CI to avoid conflicts
- Fail the build if `test.only` is found

## Troubleshooting

### Port 3000 already in use

If the dev server can't start on port 3000, either:

- Stop the existing server
- Set `reuseExistingServer: true` in playwright.config.ts

### Tests timing out

- Increase timeout in test or config
- Check if backend API is running
- Verify network connectivity

### Authentication issues

- Ensure admin credentials are correct
- Check backend authentication endpoint
- Verify session/cookie handling
