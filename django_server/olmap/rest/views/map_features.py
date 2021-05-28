from rest_framework import viewsets, permissions, mixins
from rest_framework.viewsets import GenericViewSet

from olmap import models
from olmap.rest.serializers import WorkplaceTypeSerializer, WorkplaceEntranceSerializer, \
    UnloadingPlaceSerializer
from olmap.rest.serializers.map_features import WorkplaceWithNoteSerializer


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


class WorkplacesByUrlNameViewSet(mixins.RetrieveModelMixin, GenericViewSet):
    queryset = models.Workplace.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = WorkplaceWithNoteSerializer
    lookup_field = 'url_name'
