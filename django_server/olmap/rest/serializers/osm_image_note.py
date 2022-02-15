from django.conf import settings
from rest_framework import serializers

from olmap import models
from olmap.models.map_features import manager_name

from .base import BaseOSMImageNoteSerializer
from .map_features import MapFeatureSerializer
from .user import BaseUserSerializer


class OSMImageNoteCommentSerializer(serializers.ModelSerializer):
    user = serializers.SlugRelatedField(slug_field='username', read_only=True)

    class Meta:
        model = models.OSMImageNoteComment
        fields = '__all__'


class OSMImageNoteCommentNotificationSerializer(serializers.ModelSerializer):
    comment = OSMImageNoteCommentSerializer(read_only=True)

    class Meta:
        model = models.OSMImageNoteCommentNotification
        fields = ['comment', 'id']


def height_index():
    """
    Return a dict {image_note_id: height} for height limitations on workplaces, entrances, gates and building passages.
    """
    index = {}
    for Model in [models.Entrance, models.Gate, models.BuildingPassage]:
        for i in Model.objects.filter(height__isnull=False).values('image_note_id', 'height'):
            index[i['image_note_id']] = i['height']

    workplaces = models.Workplace.objects.filter(max_vehicle_height__isnull=False)
    for i in workplaces.values('image_note_id', 'max_vehicle_height'):
        index[i['image_note_id']] = i['max_vehicle_height']

    return index


class DictOSMImageNoteSerializer(BaseOSMImageNoteSerializer):
    is_reviewed = serializers.BooleanField(read_only=True, source='reviewed_by_id')
    is_processed = serializers.BooleanField(read_only=True, source='processed_by_id')
    is_accepted = serializers.BooleanField(read_only=True, source='accepted_by_id')
    delivery_instructions = serializers.SerializerMethodField()
    height = serializers.SerializerMethodField()
    created_by = serializers.IntegerField(read_only=True, source='created_by_id')
    image = serializers.SerializerMethodField()

    false_default_fields = ['is_reviewed', 'is_processed', 'is_accepted']

    class Meta:
        model = models.OSMImageNote
        fields = BaseOSMImageNoteSerializer.Meta.fields + ['delivery_instructions', 'height']

    def to_representation(self, instance):
        result = super().to_representation(instance)
        for field in self.false_default_fields:
            result.setdefault(field, False)
        return result

    def get_image(self, note):
        return settings.MEDIA_URL + note['image'] if note.get('image', None) else None

    def get_delivery_instructions(self, note):
        return note.get('delivery_instructions', 0) > 0

    def get_height(self, note):
        if not hasattr(self, '_height_index'):
            self._height_index = height_index()
        return self._height_index.get(note['id'], None)


class OSMImageNoteSerializer(BaseOSMImageNoteSerializer):
    # upvotes = serializers.SlugRelatedField(many=True, read_only=True, slug_field='user_id')
    # downvotes = serializers.SlugRelatedField(many=True, read_only=True, slug_field='user_id')
    comments = OSMImageNoteCommentSerializer(many=True, read_only=True)

    class Meta:
        model = models.OSMImageNote
        fields = BaseOSMImageNoteSerializer.Meta.fields + ['osm_features', 'addresses', 'comments']


class OSMImageNoteSerializerMeta(serializers.SerializerMetaclass):
    def __new__(mcs, name, bases, attrs):
        # Automatically add serializer fields for all image note map_feature types:
        for prop_type in models.map_feature_types:
            PropSerializer = MapFeatureSerializer.get_subclass_for(prop_type)
            attrs[manager_name(prop_type)] = PropSerializer(many=True, required=False)
        return super().__new__(mcs, name, bases, attrs)


class OSMImageNoteWithMapFeaturesSerializer(OSMImageNoteSerializer, metaclass=OSMImageNoteSerializerMeta):
    created_by = BaseUserSerializer(read_only=True)
    delivery_instructions = serializers.SerializerMethodField()
    height = serializers.SerializerMethodField()

    class Meta:
        model = models.OSMImageNote
        fields = OSMImageNoteSerializer.Meta.fields + ['delivery_instructions', 'height'] + \
                 [manager_name(prop_type) for prop_type in models.map_feature_types]

    def get_delivery_instructions(self, note):
        return getattr(note, 'delivery_instructions', 0) > 0

    def get_height(self, note):
        if not hasattr(self, '_height_index'):
            self._height_index = height_index()
        return self._height_index.get(note.id, None)

    def create(self, validated_data):
        relateds = self.extract_related_map_features(validated_data)
        instance = super().create(validated_data)
        self.save_related_map_features(instance, relateds, new=True)
        return instance

    def save_related_map_features(self, instance, relateds, new=False):
        for related_field, fields_list in relateds.items():
            related_manager = getattr(instance, related_field)
            related_manager.exclude(id__in=[f['id'] for f in fields_list if f.get('id', None)]).delete()
            for fields in fields_list:
                if fields.get('id', None):
                    f = related_manager.get(id=fields['id'])
                    for k, v in fields.items():
                        setattr(f, k, v)
                    f.save()
                else:
                    related_manager.create(**fields)

    def extract_related_map_features(self, validated_data):
        relateds = {}
        for prop_type in models.map_feature_types:
            field = manager_name(prop_type)
            if validated_data.get(field, None) is not None:
                relateds[field] = validated_data.pop(field, [])
        return relateds

    def update(self, instance, validated_data):
        relateds = self.extract_related_map_features(validated_data)
        self.save_related_map_features(instance, relateds)
        return super().update(instance, validated_data)