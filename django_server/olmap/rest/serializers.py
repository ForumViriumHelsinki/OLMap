from collections import OrderedDict

from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm as BasePasswordResetForm
from django.contrib.auth.models import User
from django.db.models import DecimalField
from rest_auth.serializers import PasswordResetSerializer as BasePasswordResetSerializer
from rest_framework import serializers

from olmap import models
from olmap.models.map_features import manager_name
from .permissions import REVIEWER_GROUP


class RoundingDecimalField(serializers.DecimalField):
    def validate_precision(self, value):
        return value


serializers.ModelSerializer.serializer_field_mapping[DecimalField] = RoundingDecimalField


class BaseUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username']


class UserSerializer(serializers.ModelSerializer):
    is_reviewer = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'is_reviewer']

    def user_in_group(self, user, group_name):
        for group in user.groups.all():
            if group.name == group_name:
                return True
        return False

    def get_is_reviewer(self, user):
        return self.user_in_group(user, REVIEWER_GROUP)


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
    as_osm_tags = serializers.ReadOnlyField()
    osm_feature = serializers.PrimaryKeyRelatedField(read_only=True)

    @classmethod
    def get_subclass_for(cls, prop_type):
        if prop_type == models.Workplace:
            return WorkplaceSerializer

        class PropSerializer(cls):
            class Meta:
                model = prop_type
                exclude = ['image_note']
        return PropSerializer


class WorkplaceSerializer(MapFeatureSerializer):
    type = WorkplaceTypeChoiceField()

    class Meta:
        model = models.Workplace
        exclude = ['image_note']


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


class BaseOSMImageNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.OSMImageNote
        fields = ['id', 'comment', 'image', 'lat', 'lon', 'is_reviewed', 'is_processed', 'created_by', 'tags']

    def to_representation(self, instance):
        result = super().to_representation(instance)
        return OrderedDict([(key, result[key]) for key in result if result[key] not in [None, []]])


class DictOSMImageNoteSerializer(BaseOSMImageNoteSerializer):
    is_reviewed = serializers.BooleanField(read_only=True, source='reviewed_by_id')
    is_processed = serializers.BooleanField(read_only=True, source='processed_by_id')
    created_by = serializers.IntegerField(read_only=True, source='created_by_id')
    image = serializers.SerializerMethodField()

    false_default_fields = ['is_reviewed', 'is_processed']

    def to_representation(self, instance):
        result = super().to_representation(instance)
        for field in self.false_default_fields:
            result.setdefault(field, False)
        return result

    def get_image(self, note):
        return settings.MEDIA_URL + note['image'] if note.get('image', None) else None


class OSMImageNoteSerializer(BaseOSMImageNoteSerializer):
    upvotes = serializers.SlugRelatedField(many=True, read_only=True, slug_field='user_id')
    downvotes = serializers.SlugRelatedField(many=True, read_only=True, slug_field='user_id')
    comments = OSMImageNoteCommentSerializer(many=True, read_only=True)

    class Meta:
        model = models.OSMImageNote
        fields = ['id', 'comment', 'image', 'lat', 'lon', 'osm_features', 'addresses',
                  'is_reviewed', 'tags', 'created_by', 'upvotes', 'downvotes', 'comments']


class OSMImageNoteSerializerMeta(serializers.SerializerMetaclass):
    def __new__(mcs, name, bases, attrs):
        # Automatically add serializer fields for all image note map_feature types:
        for prop_type in models.map_feature_types:
            PropSerializer = MapFeatureSerializer.get_subclass_for(prop_type)
            attrs[manager_name(prop_type)] = PropSerializer(many=True, required=False)
        return super().__new__(mcs, name, bases, attrs)


class OSMImageNoteWithPropsSerializer(OSMImageNoteSerializer, metaclass=OSMImageNoteSerializerMeta):
    created_by = BaseUserSerializer(read_only=True)

    class Meta:
        model = models.OSMImageNote
        fields = (['id', 'comment', 'image', 'lat', 'lon', 'osm_features', 'addresses',
                   'is_reviewed', 'is_processed', 'tags', 'created_by', 'created_at',
                   'upvotes', 'downvotes', 'comments'] +
                  [manager_name(prop_type) for prop_type in models.map_feature_types])

    def create(self, validated_data):
        relateds = self.extract_related_map_features(validated_data)
        instance = super().create(validated_data)
        self.save_related_map_features(instance, relateds, new=True)
        return instance

    def save_related_map_features(self, instance, relateds, new=False):
        for related_field, fields_list in relateds.items():
            related_manager = getattr(instance, related_field)
            if not new:
                related_manager.all().delete()
            for fields in fields_list:
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


class OSMFeatureSerializer(serializers.ModelSerializer):
    image_notes = OSMImageNoteSerializer(many=True, read_only=True)

    class Meta:
        model = models.OSMFeature
        fields = ['id', 'associated_entrances', 'image_notes']


class OSMEntranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.OSMFeature
        fields = ['id', 'associated_features']


class WorkplaceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.WorkplaceType
        fields = '__all__'


class PasswordResetForm(BasePasswordResetForm):
    def save(self, **kwargs):
        kwargs = dict(kwargs, domain_override='app.olmap.org', use_https=True,
                      from_email=settings.EMAIL_HOST_USER or 'olmap@olmap.org')
        return super().save(**kwargs)


class PasswordResetSerializer(BasePasswordResetSerializer):
    password_reset_form_class = PasswordResetForm


class AddressAsOSMNodeSerializer(serializers.ModelSerializer):
    type = serializers.ReadOnlyField(default='node')
    tags = serializers.SerializerMethodField()

    class Meta:
        model = models.Address
        fields = ['type', 'id', 'lat', 'lon', 'tags']

    def get_tags(self, address):
        return {
            'addr:street': address.street,
            'addr:housenumber': address.housenumber
        }
