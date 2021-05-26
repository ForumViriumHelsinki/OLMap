from rest_framework import serializers

from olmap import models
from .osm_image_note import OSMImageNoteSerializer
from .map_features import WorkplaceWithNoteSerializer


class OSMFeatureSerializer(serializers.ModelSerializer):
    image_notes = OSMImageNoteSerializer(many=True, read_only=True)
    workplace = WorkplaceWithNoteSerializer(read_only=True)

    class Meta:
        model = models.OSMFeature
        fields = ['id', 'associated_entrances', 'image_notes', 'workplace']


class OSMEntranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.OSMFeature
        fields = ['id', 'associated_features']