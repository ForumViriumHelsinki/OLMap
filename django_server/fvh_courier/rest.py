from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import serializers, viewsets, permissions, routers, mixins, views, status
from rest_framework.decorators import action
from rest_framework.response import Response

from drf_jsonschema import to_jsonschema
from . import models

COURIER_GROUP = 'Courier'


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


class UserBelongsToGroup(permissions.IsAuthenticated):
    group_name = 'OVERRIDE IN SUBCLASSES!'

    def has_permission(self, request, view):
        return (super(UserBelongsToGroup, self).has_permission(request, view) and
                request.user.groups.filter(name=self.group_name).exists())


class IsCourier(UserBelongsToGroup):
    group_name = COURIER_GROUP


class PackagesViewSetMixin:
    serializer_class = PackageSerializer

    def get_queryset(self):
        return self.get_base_queryset()\
            .select_related('pickup_at', 'deliver_to', 'courier', 'sender')\
            .prefetch_related('courier__phone_numbers', 'courier__groups', 'sender__phone_numbers', 'sender__groups')


class AvailablePackagesViewSet(PackagesViewSetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsCourier]

    def get_base_queryset(self):
        return models.Package.available_packages()

    @action(detail=True, methods=['put'])
    def reserve(self, request, pk=None):
        """
        Action for courier to reserve an available package for delivery.
        """
        package = self.get_object()
        package.courier = self.request.user
        package.save()
        serializer = self.get_serializer(package)
        return Response(serializer.data)


class MyPackagesViewSet(PackagesViewSetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsCourier]

    def get_base_queryset(self):
        return self.request.user.delivered_packages.all()

    @action(detail=True, methods=['put'])
    def register_pickup(self, request, pk=None):
        """
        Action for courier to register that the package has been picked up for delivery.
        """
        package = self.get_object()
        package.picked_up_time = package.picked_up_time or timezone.now()
        package.save()
        serializer = self.get_serializer(package)
        return Response(serializer.data)

    @action(detail=True, methods=['put'])
    def register_delivery(self, request, pk=None):
        """
        Action for courier to register that the package has been delivered to recipient.
        """
        package = self.get_object()
        package.delivered_time = package.delivered_time or timezone.now()
        package.save()
        serializer = self.get_serializer(package)
        return Response(serializer.data)


class OutgoingPackagesViewSet(PackagesViewSetMixin, mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_base_queryset(self):
        return self.request.user.sent_packages.all()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'])
    def jsonschema(self, request, pk=None):
        return Response(to_jsonschema(self.get_serializer()))


router = routers.DefaultRouter()
router.register('available_packages', AvailablePackagesViewSet, 'available_package')
router.register('my_packages', MyPackagesViewSet, 'my_package')
router.register('outgoing_packages', OutgoingPackagesViewSet, 'outgoing_package')

urlpatterns = router.urls
