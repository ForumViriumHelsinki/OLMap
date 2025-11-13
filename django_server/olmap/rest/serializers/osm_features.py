from rest_framework import serializers

from olmap import models

from .map_features import WorkplaceWithNoteSerializer
from .osm_image_note import OSMImageNoteSerializer


class OSMFeatureSerializer(serializers.ModelSerializer):
    image_notes = serializers.SerializerMethodField()
    workplace = WorkplaceWithNoteSerializer(read_only=True)

    class Meta:
        model = models.OSMFeature
        fields = ["id", "workplace", "image_notes"]

    def get_image_notes(self, osm_feature):
        notes = osm_feature.image_notes.filter(visible=True)
        return OSMImageNoteSerializer(notes, many=True, context=self.context).data
