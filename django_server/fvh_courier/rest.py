from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, permissions, routers

from . import models


COURIER_GROUP = 'Courier'


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Address
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    phone_numbers = serializers.SlugRelatedField(many=True, read_only=True, slug_field='number')

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_numbers']


class PackageSerializer(serializers.ModelSerializer):
    pickup_at = AddressSerializer()
    deliver_to = AddressSerializer()

    sender = UserSerializer()
    courier = UserSerializer()

    class Meta:
        model = models.Package
        fields = '__all__'


class UserBelongsToGroup(permissions.IsAuthenticated):
    group_name = 'OVERRIDE IN SUBCLASSES!'

    def has_permission(self, request, view):
        return (super(UserBelongsToGroup, self).has_permission(request, view) and
                request.user.groups.filter(name=self.group_name).exists())


class IsCourier(UserBelongsToGroup):
    group_name = COURIER_GROUP


class AvailablePackagesViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PackageSerializer
    permission_classes = [IsCourier]
    
    def get_queryset(self):
        return models.Package.available_packages()


router = routers.DefaultRouter()
router.register('available_packages', AvailablePackagesViewSet, 'available_package')
