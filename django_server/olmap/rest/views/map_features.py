from rest_framework import viewsets, permissions

from olmap import models
from olmap.rest.serializers import WorkplaceTypeSerializer, WorkplaceEntranceSerializer, \
    UnloadingPlaceSerializer


class WorkplaceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.WorkplaceType.objects.all().prefetch_related('parents').order_by('label')
    permission_classes = [permissions.AllowAny]
    serializer_class = WorkplaceTypeSerializer


class WorkplaceEntrancesViewSet(viewsets.ModelViewSet):
    queryset = models.WorkplaceEntrance.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkplaceEntranceSerializer


class UnloadingPlacesViewSet(viewsets.ModelViewSet):
    queryset = models.UnloadingPlace.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UnloadingPlaceSerializer
