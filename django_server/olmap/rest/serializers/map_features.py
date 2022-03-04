from rest_framework import serializers

from olmap import models
from .base import BaseOSMImageNoteSerializer
from .google_translation import TranslationSerializerMixin, TranslatedField


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
    osm_feature = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=models.OSMFeature.objects)

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

        cls.registered_subclasses[prop_type] = PropSerializer
        return PropSerializer

    @classmethod
    def register_subclass(cls, model_subclass):
        def r(serializer_subclass):
            cls.registered_subclasses[model_subclass] = serializer_subclass
            return serializer_subclass
        return r


class UnloadingPlaceWithNoteSerializer(TranslationSerializerMixin, MapFeatureSerializer):
    image_note = BaseOSMImageNoteSerializer(read_only=True)
    description_translated = TranslatedField()
    description_language = TranslatedField()

    translated_fields = ['description']  # Used by TranslationSerializerMixin

    class Meta:
        model = models.UnloadingPlace
        fields = '__all__'


class WorkplaceEntranceSerializer(TranslationSerializerMixin, serializers.ModelSerializer):
    delivery_types = serializers.SlugRelatedField(slug_field='name', many=True,
                                                  queryset=models.DeliveryType.objects.all())
    image_note = BaseOSMImageNoteSerializer(read_only=True)
    entrance_data = MapFeatureSerializer.get_subclass_for(models.Entrance)(source='entrance', read_only=True)
    unloading_places = UnloadingPlaceWithNoteSerializer(many=True, read_only=True)

    delivery_instructions_translated = TranslatedField()
    delivery_instructions_language = TranslatedField()
    description_translated = TranslatedField()
    description_language = TranslatedField()

    translated_fields = ['delivery_instructions', 'description']  # Used by TranslationSerializerMixin

    class Meta:
        model = models.WorkplaceEntrance
        fields = ['deliveries', 'delivery_types', 'delivery_hours',
                  'entrance', 'workplace', 'image_note', 'entrance_data', 'unloading_places', 'id',
                  'description', 'description_translated', 'description_language',
                  'delivery_instructions', 'delivery_instructions_translated', 'delivery_instructions_language']

    def __init__(self, instance=None, data=None, **kwargs):
        if data:
            if data.get('delivery_types', None):
                for t in data['delivery_types']:
                    models.DeliveryType.objects.get_or_create(name=t)
        return super().__init__(instance, data, **kwargs)


@MapFeatureSerializer.register_subclass(models.Workplace)
class WorkplaceSerializer(TranslationSerializerMixin, MapFeatureSerializer):
    type = WorkplaceTypeChoiceField()
    workplace_entrances = WorkplaceEntranceSerializer(many=True, required=False)
    delivery_instructions_translated = TranslatedField()
    delivery_instructions_language = TranslatedField()

    translated_fields = ['delivery_instructions']  # Used by TranslationSerializerMixin

    class Meta:
        model = models.Workplace
        exclude = ['image_note']

    def to_representation(self, instance):
        # Prefill translated fields for the whole hierarchy in one request to google to speed up the response:
        self.prefill_translations(instance)
        return super().to_representation(instance)

    def prefill_translations(self, instance):
        unloading_places = []
        for e in instance.workplace_entrances.all():
            for p in e.entrance.unloading_places.all():
                unloading_places.append(p)

        self.prefill_translated_fields((
            ([instance], self.translated_fields),
            (instance.workplace_entrances.all(), WorkplaceEntranceSerializer.translated_fields),
            (unloading_places, UnloadingPlaceWithNoteSerializer.translated_fields),
        ))


class WorkplaceWithNoteIdSerializer(WorkplaceSerializer):
    class Meta:
        model = models.Workplace
        fields = '__all__'


class WorkplaceWithNoteSerializer(WorkplaceSerializer):
    image_note = BaseOSMImageNoteSerializer(read_only=True)

    class Meta:
        model = models.Workplace
        fields = '__all__'


class EntranceWithNoteSerializer(MapFeatureSerializer):
    image_note = BaseOSMImageNoteSerializer(read_only=True)

    class Meta:
        model = models.Entrance
        fields = '__all__'


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