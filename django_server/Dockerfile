# Multi-stage build for production Django application
FROM python:3.13-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_NO_CACHE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Set shell with pipefail option for safer pipe operations
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install build dependencies and uv
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && curl -LsSf https://astral.sh/uv/install.sh | bash \
    && rm -rf /var/lib/apt/lists/*

# Add uv to PATH
ENV PATH="/root/.local/bin:$PATH"

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY pyproject.toml ./
RUN uv pip install --system -e .

# Runtime stage
FROM python:3.13-slim

# OCI labels for GHCR integration
LABEL org.opencontainers.image.source="https://github.com/ForumViriumHelsinki/OLMap" \
      org.opencontainers.image.description="OLMap backend - Django REST API for geospatial data" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.vendor="Forum Virium Helsinki"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# Set shell with pipefail option for safer pipe operations
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install runtime dependencies only
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r olmap && useradd -r -g olmap olmap

# Set work directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /root/.local /home/olmap/.local

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
    CMD curl -f http://localhost:8000/health/ || exit 1

# Set entrypoint and default command
ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "olmap_config.wsgi:application"]
