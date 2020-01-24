import decimal

from django.contrib.auth.models import User
from django.db.models import DecimalField
from rest_framework import serializers

from fvh_courier import models
from .permissions import COURIER_GROUP


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

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'phone_numbers', 'is_courier']

    def get_is_courier(self, user):
        for group in user.groups.all():
            if group.name == COURIER_GROUP:
                return True
        return False


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


class OSMImageNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.OSMImageNote
        fields = ['id', 'comment', 'image', 'lat', 'lon']
