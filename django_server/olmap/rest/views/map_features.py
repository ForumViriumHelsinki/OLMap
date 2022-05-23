import geopy.distance
from rest_framework import viewsets, permissions, pagination, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema

from olmap import models
from olmap.rest.permissions import IsAuthenticatedOrNewDataPoint
from olmap.rest.serializers import WorkplaceTypeSerializer, WorkplaceEntranceSerializer
from olmap.rest.serializers.map_features import WorkplaceWithNoteSerializer
from olmap.rest.serializers.workplace_wizard import WorkplaceSerializer, EntranceSerializer, UnloadingPlaceSerializer
from olmap.rest.schema import SchemaWithParameters, with_parameters, with_example


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
        """
        Return features within approximately 100m of the position passed as lat, lon in the query parameters.
        """
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


class BaseWorkplaceViewSet(viewsets.GenericViewSet):
    queryset = models.Workplace.objects.exclude(image_note__visible=False)\
        .select_related('image_note')
    serializer_class = WorkplaceSerializer


class WorkplaceViewSet(BaseWorkplaceViewSet, MapFeatureViewSet, viewsets.ModelViewSet):
    """
    Returns workplaces, i.e. possible destinations for deliveries. Companies, government offices, schools etc.
    """
    schema = SchemaWithParameters(tags=["Workplaces"], tags_by_action={
        'search': ['Quick start'],
        'create': ['Quick start'],
        'near': ['Quick start']})

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
        """
        Search for a particular workplace by name (case insensitive, but must match the start of the name as saved
        in OLMap). Returns a list of matching OLMap workplaces along with delivery instructions if available.
        """
        name = request.query_params.get('name', None)
        if not name:
            return Response(status=404)
        queryset = self.filter_queryset(self.get_queryset()).filter(name__istartswith=name)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Create a new workplace in the OLMap database, potentially along with delivery instructions and entrance /
        unloading place locations.
        """
        return super().create(request, *args, **kwargs)


class WorkplaceByOSMIdViewSet(BaseWorkplaceViewSet, mixins.RetrieveModelMixin):
    """
    This endpoint makes it possible to query if a particular workplace found in OpenStreetMap exists in the OLMap
    database, and if so load any delivery instructions attached to it. This may be especially convenient in combination
    with e.g. the DigiTransit geocoder (see <https://digitransit.fi/en/developers/apis/2-geocoding-api/address-search/> )
    which may return OSM nodes along with their ID as results to geocoding searches.
    """
    schema = SchemaWithParameters(tags=["Workplaces", "Quick start"], operation_id_base='osm_workplace')
    lookup_field = 'osm_feature'


class WorkplaceWithNoteViewSet(BaseWorkplaceViewSet, mixins.RetrieveModelMixin):
    """
    Fetch a particular Workplace by OLMap id, serializing it along with any entrances etc. with the image notes
    as separate objects and supporting field translations.
    """
    schema = SchemaWithParameters(tags=["Workplaces"], operation_id_base='osm_workplace_with_note')
    serializer_class = WorkplaceWithNoteSerializer


class EntranceViewSet(MapFeatureViewSet):
    """
    Returns entrances entered into OLMap, along with any attached unloading places, images and links to
    corresponding OSM entrances.
    """
    schema = SchemaWithParameters(tags=["Entrances"], tags_by_action={'near': ['Quick start']})
    queryset = models.Entrance.objects.filter(image_note__visible=True)\
        .select_related('image_note')\
        .prefetch_related('unloading_places__image_note', 'unloading_places__entrances')
    serializer_class = EntranceSerializer
