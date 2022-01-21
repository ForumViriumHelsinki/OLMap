import geopy.distance
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from olmap import models
from olmap.rest.permissions import IsReviewerOrCreator
from olmap.rest.serializers import WorkplaceTypeSerializer, WorkplaceEntranceSerializer, \
    UnloadingPlaceSerializer

from olmap.rest.serializers.workplace_wizard import WorkplaceSerializer, EntranceSerializer


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


class WorkplaceViewSet(viewsets.ModelViewSet):
    queryset = models.Workplace.objects.all()
    serializer_class = WorkplaceSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsReviewerOrCreator]
        return [permission() for permission in permission_classes]


class WorkplaceByOSMIdViewSet(WorkplaceViewSet):
    lookup_field = 'osm_feature'


class EntranceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Entrance.objects.filter(image_note__visible=True)
    serializer_class = EntranceSerializer

    @action(methods=['GET'], detail=False)
    def near(self, request, *args, **kwargs):
        lat, lon = (float(request.query_params.get(s, '0')) for s in ['lat', 'lon'])
        if lat and lon:
            min_, max_ = (geopy.distance.distance(meters=60).destination((lat, lon), bearing=b) for b in (225, 45))
            queryset = self.filter_queryset(self.get_queryset()).filter(
                image_note__lat__gte=min_.latitude, image_note__lat__lte=max_.latitude,
                image_note__lon__gte=min_.longitude, image_note__lon__lte=max_.longitude,
            )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
