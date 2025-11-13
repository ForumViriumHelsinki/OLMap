#!/bin/bash
set -e

echo "🎭 Running Playwright E2E Tests..."
echo "Waiting for frontend to be ready at ${BASE_URL:-http://localhost:3000}..."

# Wait for the frontend to be accessible
max_attempts=30
attempt=0
BASE_URL=${BASE_URL:-http://localhost:3000}

while [ $attempt -lt $max_attempts ]; do
    if curl -sf "$BASE_URL" > /dev/null 2>&1; then
        echo "✓ Frontend is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for frontend... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Frontend not accessible after $max_attempts attempts"
    exit 1
fi

# Run Playwright tests
echo "Running Playwright tests..."
npm run test:e2e

echo "✓ E2E tests completed!"
