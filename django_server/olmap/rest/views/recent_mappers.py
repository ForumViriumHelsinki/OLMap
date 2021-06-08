import math
from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import permissions
from rest_framework.viewsets import ReadOnlyModelViewSet

from olmap.rest.serializers import BaseUserSerializer


class RecentMappersViewSet(ReadOnlyModelViewSet):
    serializer_class = BaseUserSerializer
    queryset = User.objects.filter(created_notes__created_at__gt=timezone.now() - timedelta(days=60)).distinct()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return User.objects.filter(created_notes__created_at__gt=timezone.now() - timedelta(days=60)).distinct()