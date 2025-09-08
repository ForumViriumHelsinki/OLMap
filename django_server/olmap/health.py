import logging

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def health_check(request):  # noqa: ARG001
    """Basic health check endpoint for Kubernetes liveness probe"""
    return JsonResponse({"status": "healthy", "service": "olmap-backend"})


def ready_check(request):  # noqa: ARG001
    """Readiness check endpoint for Kubernetes readiness probe"""
    checks = {}
    all_healthy = True

    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        checks["database"] = "unhealthy"
        all_healthy = False

    # Cache check (if configured)
    try:
        cache.set("health_check", "test", 1)
        cache.get("health_check")
        checks["cache"] = "healthy"
    except Exception as e:
        logger.warning(f"Cache health check failed: {e}")
        checks["cache"] = "unhealthy"
        # Cache failure is not critical for readiness

    status_code = 200 if all_healthy else 503
    return JsonResponse(
        {"status": "ready" if all_healthy else "not_ready", "service": "olmap-backend", "checks": checks},
        status=status_code,
    )
