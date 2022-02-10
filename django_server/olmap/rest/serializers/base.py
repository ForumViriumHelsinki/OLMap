from collections import OrderedDict

from rest_framework import serializers

from olmap import models


class BaseOSMImageNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.OSMImageNote
        fields = ['id', 'comment', 'image', 'lat', 'lon', 'is_reviewed', 'is_processed', 'is_accepted',
                  'created_by', 'tags', 'created_at', 'modified_at', 'layer']

    def to_representation(self, instance):
        result = super().to_representation(instance)
        return OrderedDict([(key, result[key]) for key in result if result[key] not in [None, []]])