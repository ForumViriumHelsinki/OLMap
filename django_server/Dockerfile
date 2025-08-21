# Multi-stage build for production Django application
FROM python:3.13-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_NO_CACHE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install system dependencies and uv
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    curl \
    && curl -LsSf https://astral.sh/uv/install.sh | sh \
    && rm -rf /var/lib/apt/lists/*

# Add uv to PATH
ENV PATH="/root/.local/bin:$PATH"

# Create non-root user
RUN groupadd -r olmap && useradd -r -g olmap olmap

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY pyproject.toml ./
RUN uv pip install --system -e .

# Copy entrypoint and make it executable
COPY --chown=olmap:olmap entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Copy project files
COPY --chown=olmap:olmap . .

# Collect static files (provide temporary secret key for build)
RUN DJANGO_SECRET_KEY=build-time-only python manage.py collectstatic --noinput

# Switch to non-root user
USER olmap

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health/', timeout=10)"

# Default command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "olmap_config.wsgi:application"]
