import math
from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import permissions
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.viewsets import ReadOnlyModelViewSet

from olmap.rest.serializers import BaseUserSerializer


class RecentMappersViewSet(ReadOnlyModelViewSet):
    """
    Return users who have created notes in the last 60 days; intended to allow filtering by note creator in the
    OLMap UI.
    """
    schema = AutoSchema(tags=["Mappers"], operation_id_base='mapper')
    serializer_class = BaseUserSerializer
    queryset = User.objects.filter(created_notes__created_at__gt=timezone.now() - timedelta(days=60)).distinct()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return User.objects.filter(created_notes__created_at__gt=timezone.now() - timedelta(days=60)).distinct()
