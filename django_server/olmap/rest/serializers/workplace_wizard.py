from rest_framework import serializers

from olmap import models


class MapFeatureSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(source='image_note.lat')
    lon = serializers.FloatField(source='image_note.lon')
    image = serializers.ImageField(source='image_note.image')
    image_note_id = serializers.PrimaryKeyRelatedField(queryset=models.OSMImageNote.objects.all())

    class Meta:
        model = models.MapFeature
        fields = ['lat', 'lon', 'image_note_id', 'id', 'image']


mf_fields = MapFeatureSerializer.Meta.fields


class UnloadingPlaceSerializer(MapFeatureSerializer):
    class Meta:
        model = models.UnloadingPlace
        fields = mf_fields + ['access_points']


class WorkplaceEntranceSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(source='entrance.image_note.lat')
    lon = serializers.FloatField(source='entrance.image_note.lon')
    image = serializers.ImageField(source='entrance.image_note.image')
    osm_feature = serializers.IntegerField(source='entrance.osm_feature_id')
    image_note_id = serializers.IntegerField(source='entrance.image_note_id')
    unloading_places = UnloadingPlaceSerializer(many=True)

    class Meta:
        model = models.WorkplaceEntrance
        fields = mf_fields + ['entrance', 'osm_feature', 'deliveries', 'unloading_places', 'description']


class WorkplaceSerializer(MapFeatureSerializer):
    workplace_entrances = WorkplaceEntranceSerializer(many=True, read_only=True)

    class Meta:
        model = models.Workplace
        fields = mf_fields + ['street', 'housenumber', 'unit', 'osm_feature', 'workplace_entrances',
                              'name', 'delivery_instructions', 'max_vehicle_height']

    def update(self, instance, validated_data):
        note_fields = validated_data.pop('image_note', {})
        ret = super().update(instance, validated_data)
        for (f, v) in note_fields.items():
            setattr(instance.image_note, f, v)
        instance.image_note.save()
        return ret


class EntranceSerializer(MapFeatureSerializer):
    class Meta:
        model = models.Entrance
        fields = mf_fields + ['street', 'housenumber', 'unit', 'type', 'description', 'loadingdock', 'layer']
