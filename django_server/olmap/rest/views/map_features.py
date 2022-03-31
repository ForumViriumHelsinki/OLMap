import geopy.distance
from rest_framework import viewsets, permissions, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema

from olmap import models
from olmap.rest.permissions import IsAuthenticatedOrNewDataPoint
from olmap.rest.serializers import WorkplaceTypeSerializer, WorkplaceEntranceSerializer
from olmap.rest.serializers.workplace_wizard import WorkplaceSerializer, EntranceSerializer, UnloadingPlaceSerializer
from olmap.rest.schema import SchemaWithParameters, with_parameters


class WorkplaceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Returns registered workplace types, identified by id and name. New types may be created by system
    administrators  as needed.
    """
    schema = AutoSchema(tags=["Workplaces"])
    queryset = models.WorkplaceType.objects.all().prefetch_related('parents').order_by('label')
    permission_classes = [permissions.AllowAny]
    serializer_class = WorkplaceTypeSerializer


class WorkplaceEntrancesViewSet(viewsets.ModelViewSet):
    """
    Returns workplace entrances, i.e. objects connecting a particular workplace to a particular entrance, optionally
    detailing the usage types for that entrance in the conttext of the workplace.
    """
    schema = AutoSchema(tags=["Workplace entrances"])
    queryset = models.WorkplaceEntrance.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkplaceEntranceSerializer


class Pagination(pagination.PageNumberPagination):
    page_size = 100


class MapFeatureViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = Pagination
    schema = SchemaWithParameters()

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search', 'near', 'create']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAuthenticatedOrNewDataPoint]
        return [permission() for permission in permission_classes]

    @with_parameters(['lat', 'lon'])
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
    """
    Returns unloading places, i.e. recommended places to leave the vehicle while delivering goods to particular
    entrances.
    """
    schema = SchemaWithParameters(tags=["Unloading places"])
    queryset = models.UnloadingPlace.objects.exclude(image_note__visible=False).select_related('image_note')
    serializer_class = UnloadingPlaceSerializer


class WorkplaceViewSet(MapFeatureViewSet, viewsets.ModelViewSet):
    """
    Returns workplaces, i.e. possible destinations for deliveries. Companies, government offices, schools etc.
    """
    schema = SchemaWithParameters(tags=["Workplaces"])
    queryset = models.Workplace.objects.exclude(image_note__visible=False)\
        .select_related('image_note')
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

    @with_parameters(['name'])
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
    """
    Returns entrances entered into OLMap, along with any attached unloading places, images and links to
    corresponding OSM entrances.
    """
    schema = SchemaWithParameters(tags=["Entrances"])
    queryset = models.Entrance.objects.filter(image_note__visible=True)\
        .select_related('image_note')\
        .prefetch_related('unloading_places__image_note', 'unloading_places__entrances')
    serializer_class = EntranceSerializer
