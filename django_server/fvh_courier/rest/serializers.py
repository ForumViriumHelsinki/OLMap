from collections import OrderedDict

from django.contrib.auth.models import User
from django.db.models import DecimalField
from rest_framework import serializers

from fvh_courier import models
from fvh_courier.models.image_note_properties import manager_name
from .permissions import COURIER_GROUP, REVIEWER_GROUP, SENDER_GROUP


class RoundingDecimalField(serializers.DecimalField):
    def validate_precision(self, value):
        return value


serializers.ModelSerializer.serializer_field_mapping[DecimalField] = RoundingDecimalField


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Address
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    phone_numbers = serializers.SlugRelatedField(many=True, read_only=True, slug_field='number')
    is_courier = serializers.SerializerMethodField()
    is_reviewer = serializers.SerializerMethodField()
    is_sender = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username',
                  'phone_numbers', 'is_courier', 'is_reviewer', 'is_sender']

    def user_in_group(self, user, group_name):
        for group in user.groups.all():
            if group.name == group_name:
                return True
        return False

    def get_is_courier(self, user):
        return self.user_in_group(user, COURIER_GROUP)

    def get_is_reviewer(self, user):
        return self.user_in_group(user, REVIEWER_GROUP)

    def get_is_sender(self, user):
        return self.user_in_group(user, SENDER_GROUP)


class PackageSerializer(serializers.ModelSerializer):
    pickup_at = AddressSerializer(read_only=False)
    deliver_to = AddressSerializer(read_only=False)

    sender = UserSerializer(required=False, read_only=True)
    courier = UserSerializer(required=False, read_only=True)

    def create(self, validated_data):
        """
        Overridden create method to allow creating / referring to addresses; vanilla DRF create does not
        support creation of related objects.
        """
        pickup_at = models.Address.objects.get_or_create(**validated_data.pop('pickup_at'))[0]
        deliver_to = models.Address.objects.get_or_create(**validated_data.pop('deliver_to'))[0]
        return models.Package.objects.create(pickup_at=pickup_at, deliver_to=deliver_to, **validated_data)

    class Meta:
        model = models.Package
        fields = '__all__'
        read_only_fields = ['picked_up_time', 'delivered_time']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.UserLocation
        exclude = ['user']


class OutgoingPackageSerializer(PackageSerializer):
    courier_location = serializers.SerializerMethodField()

    def get_courier_location(self, package):
        # If the location is not relevant to this package, return None:
        if package.delivered_time or not package.courier_id:
            return None

        try:
            location = package.courier.location
        except models.UserLocation.DoesNotExist:
            return None

        # Do not return some old location for the courier that may not be related to this package:
        if location.modified_at < package.modified_at:
            return None

        return LocationSerializer(location).data


class ImageNotePropertiesSerializer(serializers.ModelSerializer):
    as_osm_tags = serializers.ReadOnlyField()

    @classmethod
    def get_subclass_for(cls, prop_type):
        class PropSerializer(cls):
            class Meta:
                model = prop_type
                exclude = ['image_note']
        return PropSerializer


class CreateableSlugRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        try:
            return self.get_queryset().model(**{self.slug_field: data})
        except (TypeError, ValueError):
            self.fail('invalid')


class OSMImageNoteCommentSerializer(serializers.ModelSerializer):
    user = serializers.SlugRelatedField(slug_field='username', read_only=True)

    class Meta:
        model = models.OSMImageNoteComment
        fields = '__all__'


class BaseOSMImageNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.OSMImageNote
        fields = ['id', 'comment', 'image', 'lat', 'lon', 'is_reviewed', 'created_by']

    def to_representation(self, instance):
        result = super().to_representation(instance)
        return OrderedDict([(key, result[key]) for key in result if result[key] not in [None, []]])


class OSMImageNoteSerializer(BaseOSMImageNoteSerializer):
    tags = CreateableSlugRelatedField(
        many=True, required=False, slug_field='tag', queryset=models.ImageNoteTag.objects.all())
    upvotes = serializers.SlugRelatedField(many=True, read_only=True, slug_field='user_id')
    downvotes = serializers.SlugRelatedField(many=True, read_only=True, slug_field='user_id')
    comments = OSMImageNoteCommentSerializer(many=True, read_only=True)

    class Meta:
        model = models.OSMImageNote
        fields = ['id', 'comment', 'image', 'lat', 'lon', 'osm_features', 'is_reviewed', 'tags',
                  'created_by', 'upvotes', 'downvotes', 'comments']


class OSMImageNoteSerializerMeta(serializers.SerializerMetaclass):
    def __new__(mcs, name, bases, attrs):
        # Automatically add serializer fields for all image note property types:
        for prop_type in models.image_note_property_types:
            PropSerializer = ImageNotePropertiesSerializer.get_subclass_for(prop_type)
            attrs[manager_name(prop_type)] = PropSerializer(many=True, required=False)
        return super().__new__(mcs, name, bases, attrs)


class OSMImageNoteWithPropsSerializer(OSMImageNoteSerializer, metaclass=OSMImageNoteSerializerMeta):
    class Meta:
        model = models.OSMImageNote
        fields = (['id', 'comment', 'image', 'lat', 'lon', 'osm_features', 'is_reviewed', 'tags',
                   'created_by', 'upvotes', 'downvotes', 'comments'] +
                  [manager_name(prop_type) for prop_type in models.image_note_property_types])

    def create(self, validated_data):
        tags = validated_data.pop('tags', None)
        relateds = self.extract_related_properties(validated_data)
        instance = super().create(validated_data)
        self.save_related_properties(instance, relateds, new=True)
        self.save_tags(instance, tags)
        return instance

    def save_related_properties(self, instance, relateds, new=False):
        for related_field, fields_list in relateds.items():
            related_manager = getattr(instance, related_field)
            if not new:
                related_manager.all().delete()
            for fields in fields_list:
                related_manager.create(**fields)

    def extract_related_properties(self, validated_data):
        relateds = {}
        for prop_type in models.image_note_property_types:
            field = manager_name(prop_type)
            if validated_data.get(field, None):
                relateds[field] = validated_data.pop(field)
        return relateds

    def save_tags(self, instance, tags):
        if not tags:
            return
        instance.tags.all().delete()
        for tag in tags:
            tag.image_note = instance
            tag.save()

    def update(self, instance, validated_data):
        relateds = self.extract_related_properties(validated_data)
        self.save_tags(instance, validated_data.get('tags', None))
        self.save_related_properties(instance, relateds)
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
