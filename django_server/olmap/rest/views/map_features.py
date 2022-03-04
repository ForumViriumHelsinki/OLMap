import geopy.distance
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from olmap import models
from olmap.rest.permissions import IsReviewerOrCreator
from olmap.rest.serializers import WorkplaceTypeSerializer, WorkplaceEntranceSerializer
from olmap.rest.serializers.workplace_wizard import WorkplaceSerializer, EntranceSerializer, UnloadingPlaceSerializer


class WorkplaceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.WorkplaceType.objects.all().prefetch_related('parents').order_by('label')
    permission_classes = [permissions.AllowAny]
    serializer_class = WorkplaceTypeSerializer


class WorkplaceEntrancesViewSet(viewsets.ModelViewSet):
    queryset = models.WorkplaceEntrance.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkplaceEntranceSerializer


class MapFeatureViewSet(viewsets.ReadOnlyModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search', 'near']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(methods=['GET'], detail=False)
    def near(self, request, *args, **kwargs):
        lat, lon = (float(request.query_params.get(s, '0')) for s in ['lat', 'lon'])
        if lat and lon:
            min_, max_ = (geopy.distance.distance(meters=100).destination((lat, lon), bearing=b) for b in (225, 45))
            queryset = self.filter_queryset(self.get_queryset()).filter(
                image_note__lat__gte=min_.latitude, image_note__lat__lte=max_.latitude,
                image_note__lon__gte=min_.longitude, image_note__lon__lte=max_.longitude,
            )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UnloadingPlacesViewSet(MapFeatureViewSet, viewsets.ModelViewSet):
    queryset = models.UnloadingPlace.objects.exclude(image_note__visible=False).select_related('image_note')
    serializer_class = UnloadingPlaceSerializer


class WorkplaceViewSet(MapFeatureViewSet, viewsets.ModelViewSet):
    queryset = models.Workplace.objects.exclude(image_note__visible=False)\
        .select_related('image_note')\
        .prefetch_related('workplace_entrances__entrance__image_note',
                          'workplace_entrances__entrance__unloading_places__image_note')
    serializer_class = WorkplaceSerializer

    def get_serializer(self, *args, **kwargs):
        data = kwargs.get('data', None)
        if data:
            if isinstance(data.get('image', None), str):
                data.pop('image')
            for e in data.get('workplace_entrances', []):
                if isinstance(e.get('image', None), str):
                    e.pop('image')
                for up in e.get('unloading_places', []):
                    if isinstance(up.get('image', None), str):
                        up.pop('image')
        return super().get_serializer(*args, **kwargs)

    @action(methods=['GET'], detail=False)
    def search(self, request, *args, **kwargs):
        name = request.query_params.get('name', None)
        if not name:
            return Response(status=404)
        queryset = self.filter_queryset(self.get_queryset()).filter(name__istartswith=name)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class WorkplaceByOSMIdViewSet(WorkplaceViewSet):
    lookup_field = 'osm_feature'


class EntranceViewSet(MapFeatureViewSet):
    queryset = models.Entrance.objects.filter(image_note__visible=True).select_related('image_note')
    serializer_class = EntranceSerializer
