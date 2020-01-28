from django.utils import timezone
from rest_framework import viewsets, mixins, permissions
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response

from drf_jsonschema import to_jsonschema
from fvh_courier import models
from .serializers import PackageSerializer, OutgoingPackageSerializer, LocationSerializer, OSMImageNoteSerializer
from .permissions import IsCourier


class PackagesViewSetMixin:
    serializer_class = PackageSerializer

    def get_queryset(self):
        return self.get_base_queryset()\
            .select_related('pickup_at', 'deliver_to', 'courier__location', 'sender')\
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
        models.PackageSMS.notify_sender_of_reservation(package, referer=request.headers.get('referer', None))
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
        models.PackageSMS.notify_recipient_of_pickup(package, referer=request.headers.get('referer', None))
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
        models.PackageSMS.notify_sender_of_delivery(package, referer=request.headers.get('referer', None))
        serializer = self.get_serializer(package)
        return Response(serializer.data)


class OutgoingPackagesViewSet(PackagesViewSetMixin, mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OutgoingPackageSerializer

    def get_base_queryset(self):
        return self.request.user.sent_packages.all()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'])
    def jsonschema(self, request, pk=None):
        return Response(to_jsonschema(self.get_serializer()))


class PackagesByUUIDReadOnlyViewSet(PackagesViewSetMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = OutgoingPackageSerializer
    lookup_field = 'uuid'

    def get_base_queryset(self):
        return models.Package.objects.all()


class MyLocationView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCourier]
    serializer_class = LocationSerializer

    def get_object(self):
        try:
            return self.request.user.location
        except models.UserLocation.DoesNotExist:
            return models.UserLocation(user=self.request.user)


class OSMImageNotesViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OSMImageNoteSerializer
    queryset = models.OSMImageNote.objects.all()

    def get_permissions(self):
        if self.action == 'as_geojson':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        for id in request.data['osm_features']:
            models.OSMFeature.objects.get_or_create(id=id)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        osm_image_note = serializer.save()
        osm_image_note.created_by = self.request.user
        osm_image_note.modified_by = self.request.user
        osm_image_note.save()

    def perform_update(self, serializer):
        osm_image_note = serializer.save()
        osm_image_note.modified_by = self.request.user
        osm_image_note.save()

    @action(methods=['GET'], detail=False)
    def as_geojson(self, request, *args, **kwargs):
        return Response({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [note.lon, note.lat]
                },
                "properties": self.get_serializer(note).data
            } for note in self.get_queryset()]
        })
