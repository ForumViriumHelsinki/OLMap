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
    def post(self, request):
        serializer = SearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.data)
        workplace = data.pop('workplace', None)
        osm_id = data.pop('osm_id', None)

        if osm_id:
            workplaces = models.Workplace.objects.filter(Q(osm_feature__id=osm_id))
        elif workplace:
            workplaces = models.Workplace.objects.filter(name=workplace)
        else:
            workplaces = models.Workplace.objects.filter(**data)

        entrances = models.Entrance.objects.filter(**data)

        return Response({
            'workplaces': WorkplaceWithNoteSerializer(workplaces, many=True).data,
            'entrances': EntranceWithNoteSerializer(entrances, many=True).data
        })
