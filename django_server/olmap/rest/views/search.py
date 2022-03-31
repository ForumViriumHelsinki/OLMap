from django.db.models import Q
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from olmap import models
from olmap.rest.serializers.map_features import WorkplaceWithNoteSerializer, EntranceWithNoteSerializer


class SearchSerializer(serializers.Serializer):
    workplace = serializers.CharField(required=False, allow_blank=True)
    osm_id = serializers.CharField(required=False, allow_blank=True)

    street = serializers.CharField(required=False, allow_blank=True)
    housenumber = serializers.CharField(required=False, allow_blank=True)
    unit = serializers.CharField(required=False, allow_blank=True)


class SearchView(APIView):
    """
    Allow searching for OLMap data based on search criteria; returns image notes and/or workplaces matching
    the given criteria. Intended to be used by other services to check availability of OLMap instructions
    for a particular workplace.

    Possibly unneeded & superceded by the search function in the workplaces API.
    """
    schema = None  # Remove from API spec for now, possibly to be removed from the API as well

    def post(self, request):
        serializer = SearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.data)
        workplace = data.pop('workplace', None)
        osm_id = data.pop('osm_id', None)

        if osm_id:
            workplaces = models.Workplace.objects.filter(osm_feature__id=osm_id)
        elif workplace:
            workplaces = models.Workplace.objects.filter(name=workplace)
        else:
            workplaces = models.Workplace.objects.filter(**data)

        if data.get('street', None) and data.get('housenumber', None):
            entrances = models.Entrance.objects.filter(**data)
        else:
            entrances = models.Entrance.objects.none()

        return Response({
            'workplaces': WorkplaceWithNoteSerializer(workplaces, many=True, context={'request': request}).data,
            'entrances': EntranceWithNoteSerializer(entrances, many=True, context={'request': request}).data
        })
