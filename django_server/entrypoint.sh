#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
if [ "${SQL_HOST:-}" ]; then
    echo "Waiting for PostgreSQL at $SQL_HOST:$SQL_PORT..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

# Run migrations only if DJANGO_MIGRATE is set to true
if [ "${DJANGO_MIGRATE:-false}" = "true" ]; then
    echo "Running database migrations..."
    python manage.py migrate
fi

# Execute the main command
exec "$@"
