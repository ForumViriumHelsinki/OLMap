from rest_framework import serializers

from olmap import models
from .osm_image_note import OSMImageNoteSerializer
from .map_features import WorkplaceWithNoteSerializer


class OSMFeatureSerializer(serializers.ModelSerializer):
    image_notes = serializers.SerializerMethodField()
    workplace = WorkplaceWithNoteSerializer(read_only=True)

    class Meta:
        model = models.OSMFeature
        fields = ['id', 'associated_entrances', 'image_notes', 'workplace']

    def get_image_notes(self, osm_feature):
        return OSMImageNoteSerializer(osm_feature.image_notes.filter(visible=True), many=True).data


class OSMEntranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.OSMFeature
        fields = ['id', 'associated_features']