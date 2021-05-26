from rest_framework import serializers

from olmap import models
from .base import BaseOSMImageNoteSerializer


class WorkplaceTypeChoiceField(serializers.ChoiceField):
    def __init__(self, **kwargs):
        self.html_cutoff = kwargs.pop('html_cutoff', self.html_cutoff)
        self.html_cutoff_text = kwargs.pop('html_cutoff_text', self.html_cutoff_text)
        self.allow_blank = kwargs.pop('allow_blank', False)
        self._choices = None

        super(serializers.ChoiceField, self).__init__(**kwargs)

    def to_representation(self, value):
        if value in ('', None):
            return value
        return value.id

    def to_internal_value(self, data):
        if data:
            return models.WorkplaceType.objects.get(id=data)

    @property
    def choices(self):
        if not self._choices:
            types = models.WorkplaceType.objects.values('id', 'label').order_by('label')
            self._set_choices([(t['id'], t['label']) for t in types])
        return self._choices


class MapFeatureSerializer(serializers.ModelSerializer):
    # Ensure id gets passed to OSMImageNoteWithMapFeaturesSerializer.save_related_map_features:
    id = serializers.IntegerField(read_only=False, required=False)
    as_osm_tags = serializers.ReadOnlyField()
    osm_feature = serializers.PrimaryKeyRelatedField(read_only=True)

    # Register custom subclasses for specific map feature types here:
    registered_subclasses = {}

    @classmethod
    def get_subclass_for(cls, prop_type):
        subcls = cls.registered_subclasses.get(prop_type, None)
        if subcls:
            return subcls

        class PropSerializer(cls):
            class Meta:
                model = prop_type
                exclude = ['image_note']
        return PropSerializer

    @classmethod
    def register_subclass(cls, model_subclass):
        def r(serializer_subclass):
            cls.registered_subclasses[model_subclass] = serializer_subclass
            return serializer_subclass
        return r


class UnloadingPlaceWithNoteSerializer(MapFeatureSerializer):
    image_note = BaseOSMImageNoteSerializer(read_only=True)

    class Meta:
        model = models.UnloadingPlace
        fields = '__all__'


class WorkplaceEntranceSerializer(serializers.ModelSerializer):
    delivery_types = serializers.SlugRelatedField(slug_field='name', many=True,
                                                  queryset=models.DeliveryType.objects.all())
    image_note = BaseOSMImageNoteSerializer(read_only=True)
    entrance_data = MapFeatureSerializer.get_subclass_for(models.Entrance)(source='entrance', read_only=True)
    unloading_places = UnloadingPlaceWithNoteSerializer(many=True, read_only=True)

    class Meta:
        model = models.WorkplaceEntrance
        fields = '__all__'

    def __init__(self, instance=None, data=None, **kwargs):
        if data:
            if data.get('delivery_types', None):
                for t in data['delivery_types']:
                    models.DeliveryType.objects.get_or_create(name=t)
        return super().__init__(instance, data, **kwargs)


@MapFeatureSerializer.register_subclass(models.Workplace)
class WorkplaceSerializer(MapFeatureSerializer):
    type = WorkplaceTypeChoiceField()
    workplace_entrances = WorkplaceEntranceSerializer(many=True, read_only=True)

    class Meta:
        model = models.Workplace
        exclude = ['image_note']


@MapFeatureSerializer.register_subclass(models.UnloadingPlace)
class UnloadingPlaceSerializer(MapFeatureSerializer):
    entrance_notes = serializers.SlugRelatedField(
        slug_field='image_note_id', source='entrances', read_only=True, many=True)

    class Meta:
        model = models.UnloadingPlace
        exclude = ['image_note']


class WorkplaceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.WorkplaceType
        fields = '__all__'