import math

from django.utils import timezone
from rest_framework import viewsets, mixins, permissions, decorators, status
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListAPIView, get_object_or_404
from rest_framework.response import Response

from drf_jsonschema import to_jsonschema
from fvh_courier import models

from .serializers import (
    PackageSerializer, OutgoingPackageSerializer, LocationSerializer,
    OSMImageNoteWithPropsSerializer, OSMImageNoteCommentSerializer, OSMEntranceSerializer,
    OSMFeatureSerializer, BaseOSMImageNoteSerializer, AddressAsOSMNodeSerializer)
from .permissions import IsCourier, IsReviewer


class PackagesViewSetMixin:
    serializer_class = PackageSerializer

    def get_queryset(self):
        return self.get_base_queryset()\
            .select_related('pickup_at', 'deliver_to', 'sender__user', 'courier__user')


class AvailablePackagesViewSet(PackagesViewSetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsCourier]

    def get_base_queryset(self):
        return models.Package.available_packages_for_courier(self.request.user.courier)

    @action(detail=True, methods=['put'])
    def reserve(self, request, pk=None):
        """
        Action for courier to reserve an available package for delivery.
        """
        courier_id = request.data.get('courier', None)
        if courier_id:
            courier = models.Courier.objects.filter(id=courier_id, company__coordinator__user=request.user).first()
            if not courier:
                return Response(status=status.HTTP_404_NOT_FOUND)
        else:
            courier = self.request.user.courier

        package = self.get_object()
        package.courier = courier
        package.save()

        models.PackageSMS.notify_sender_of_reservation(package, referer=request.headers.get('referer', None))
        serializer = self.get_serializer(package)
        return Response(serializer.data)


class MyPackagesViewSet(PackagesViewSetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsCourier]

    def get_base_queryset(self):
        user = self.request.user
        return models.CourierCompany.packages_for_user(user).filter(delivered_time__isnull=True)

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


class MyDeliveredPackagesViewSet(PackagesViewSetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsCourier]

    def get_base_queryset(self):
        return models.CourierCompany.packages_for_user(self.request.user).filter(delivered_time__isnull=False)


class PendingOutgoingPackagesViewSet(PackagesViewSetMixin, mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OutgoingPackageSerializer

    def get_base_queryset(self):
        return models.Package.sent_by_user(self.request.user).filter(delivered_time=None)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user.sender, courier_company_id=self.request.user.sender.courier_company_id)

    @action(detail=False, methods=['get'])
    def jsonschema(self, request, pk=None):
        return Response(to_jsonschema(self.get_serializer()))


class DeliveredOutgoingPackagesViewSet(PackagesViewSetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OutgoingPackageSerializer

    def get_base_queryset(self):
        return models.Package.sent_by_user(self.request.user).filter(delivered_time__isnull=False)


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
        return get_object_or_404(models.Courier, user=self.request.user)


class OSMImageNotesViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OSMImageNoteWithPropsSerializer
    queryset = models.OSMImageNote.objects.filter(visible=True).prefetch_related('tags')

    # Use simple serializer for list to improve performance:
    serializer_classes = {
        'list': BaseOSMImageNoteSerializer
    }

    def get_serializer_class(self):
        return self.serializer_classes.get(self.action, self.serializer_class)

    def get_permissions(self):
        if self.action in ['retrieve', 'list', 'property_schemas']:
            return [permissions.AllowAny()]
        else:
            return super().get_permissions()

    def create(self, request, *args, **kwargs):
        self.ensure_features(request)
        return super().create(request, *args, **kwargs)

    @decorators.permission_classes([IsReviewer])
    def update(self, request, *args, **kwargs):
        self.ensure_features(request)
        return super().update(request, *args, **kwargs)

    def ensure_features(self, request):
        for id in request.data.get('osm_features', []):
            models.OSMFeature.objects.get_or_create(id=id)

    def perform_create(self, serializer):
        osm_image_note = serializer.save()
        osm_image_note.created_by = self.request.user
        osm_image_note.modified_by = self.request.user
        osm_image_note.save()

    def perform_update(self, serializer):
        osm_image_note = serializer.save()
        osm_image_note.modified_by = self.request.user
        osm_image_note.save()

    @action(methods=['PUT'], detail=True)
    @decorators.permission_classes([IsReviewer])
    def mark_reviewed(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        if not osm_image_note.processed_by:
            osm_image_note.processed_by = request.user
        osm_image_note.reviewed_by = request.user
        osm_image_note.save()
        return Response('OK')

    @action(methods=['PUT'], detail=True)
    @decorators.permission_classes([IsReviewer])
    def mark_processed(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.processed_by = request.user
        osm_image_note.save()
        return Response('OK')

    @action(methods=['PUT'], detail=True)
    @decorators.permission_classes([IsReviewer])
    def hide_note(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.reviewed_by = request.user
        osm_image_note.visible = False
        osm_image_note.hidden_reason = request.data.get('hidden_reason', '')
        osm_image_note.save()
        return Response('OK')

    @action(methods=['PUT'], detail=True)
    def upvote(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.upvotes.get_or_create(user=request.user)
        osm_image_note.downvotes.filter(user=request.user).delete()
        osm_image_note = self.get_object() # Reload from db
        serializer = self.get_serializer(osm_image_note)
        return Response(serializer.data)

    @action(methods=['PUT'], detail=True)
    def downvote(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.downvotes.get_or_create(user=request.user)
        osm_image_note.upvotes.filter(user=request.user).delete()
        osm_image_note = self.get_object() # Reload from db
        serializer = self.get_serializer(osm_image_note)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def property_schemas(self, request, pk=None):
        serializer = self.get_serializer()
        return Response(dict((
            prop_type.__name__,
            to_jsonschema(serializer.fields[prop_type.__name__.lower() + '_set'].child)
        ) for prop_type in models.image_note_property_types))


class OSMImageNoteCommentsViewSet(viewsets.ModelViewSet):
    queryset = models.OSMImageNoteComment.objects.all().select_related('user')
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OSMImageNoteCommentSerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)


class OSMEntrancesViewSet(viewsets.ModelViewSet):
    queryset = models.OSMFeature.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OSMEntranceSerializer

    def update(self, request, *args, **kwargs):
        self.ensure_features(request)
        return super().update(request, *args, **kwargs)

    def ensure_features(self, request):
        for id in request.data.get('associated_features', []) + [self.kwargs['pk']]:
            models.OSMFeature.objects.get_or_create(id=id)


class OSMFeaturesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.OSMFeature.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = OSMFeatureSerializer


class OSMImageNotesGeoJSON(ListAPIView):
    serializer_class = BaseOSMImageNoteSerializer
    queryset = models.OSMImageNote.objects.filter(visible=True)
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
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


class NearbyAddressesView(ListAPIView):
    serializer_class = AddressAsOSMNodeSerializer
    queryset = models.Address.objects.filter(official=True)
    permission_classes = [permissions.AllowAny]

    max_distance_meters = 100
    m_per_lat = 111200

    def get_queryset(self):
        lat = float(self.kwargs['lat'])
        lon = float(self.kwargs['lon'])
        lat_diff = self.max_distance_meters / self.m_per_lat
        lon_diff = lat_diff / abs(math.cos(lat * (math.pi / 180)))
        return self.queryset.filter(
            lat__gt=lat-lat_diff, lat__lt=lat+lat_diff,
            lon__gt=lon-lon_diff, lon__lt=lon+lon_diff,
        )