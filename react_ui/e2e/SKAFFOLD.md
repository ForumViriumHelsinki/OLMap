# Playwright E2E Tests with Skaffold

This document describes how to run Playwright e2e tests with Skaffold.

## Quick Start

### Method 1: Using Skaffold + Make (Recommended)

```bash
# Terminal 1: Start Skaffold with port-forwarding
skaffold dev

# Wait for message: "Port forwarding service/olmap-frontend in namespace olmap..."

# Terminal 2: Run e2e tests
make test-e2e
```

### Method 2: Using Skaffold Verify Profile

```bash
# Deploy and automatically run tests
skaffold run -p with-tests

# Or for continuous development
skaffold dev -p with-tests
```

## How It Works

### Skaffold Port-Forwarding

When you run `skaffold dev`, it automatically forwards these ports:

- `localhost:3000` → `olmap-frontend` service
- `localhost:8000` → `olmap-backend` service
- `localhost:5432` → `postgres` service

This allows Playwright tests to access the Kubernetes-deployed app via localhost.

### Test Execution Flow

1. **Skaffold deploys** the application to Kubernetes
2. **Port-forwards** are established to localhost
3. **Test script** (`run-e2e-tests.sh`) waits for frontend to be ready
4. **Playwright tests** run against `localhost:3000`

### Verify Profile

The `with-tests` profile adds a verify stage that:

1. Runs tests in a Playwright Docker container
2. Accesses the app via `host.docker.internal:3000`
3. Reports test results

## Configuration

### Environment Variables

- `BASE_URL` - Override default localhost:3000
- `ADMIN_USERNAME` - Admin login (default: 'admin')
- `ADMIN_PASSWORD` - Admin password (default: 'admin')

Example:

```bash
BASE_URL=http://custom-host:8080 make test-e2e
```

### Skaffold Profiles

Edit `skaffold.yaml` to customize the `with-tests` profile:

```yaml
profiles:
  - name: with-tests
    verify:
      - name: e2e-tests
        container:
          name: playwright-runner
          image: mcr.microsoft.com/playwright:v1.56.1-focal
          # ... test configuration
```

## Troubleshooting

### Tests fail with "Failed to fetch"

**Problem:** Backend API not accessible

**Solution:** Ensure all services are ready:

```bash
# Check Skaffold status
kubectl get pods -n olmap

# Wait for all pods to be Running
kubectl wait --for=condition=ready pod -l app=olmap-backend -n olmap --timeout=300s
kubectl wait --for=condition=ready pod -l app=olmap-frontend -n olmap --timeout=300s
```

### Tests timeout waiting for frontend

**Problem:** Frontend not responding on localhost:3000

**Solution:** Verify port-forward:

```bash
# Check if port 3000 is forwarded
lsof -i :3000

# Restart Skaffold if needed
skaffold delete && skaffold dev
```

### Verify profile fails

**Problem:** Container can't access services

**Solution:** The verify profile uses `host.docker.internal` which may not work on all systems. Use Method 1 (Make) instead:

```bash
# Use the reliable method
skaffold dev
# In another terminal:
make test-e2e
```

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
# .github/workflows/test.yml
- name: Deploy with Skaffold
  run: skaffold run -p with-tests

# Or manually run tests
- name: Deploy and test
  run: |
    skaffold run &
    kubectl wait --for=condition=ready pod --all -n olmap --timeout=300s
    make test-e2e
```

## See Also

- [TESTING.md](../../TESTING.md) - Complete testing guide
- [README.md](../e2e/README.md) - Playwright test documentation
- `Makefile` - Available test targets
