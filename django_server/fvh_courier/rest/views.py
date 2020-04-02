from django.utils import timezone
from rest_framework import viewsets, mixins, permissions, decorators
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.response import Response

from drf_jsonschema import to_jsonschema
from fvh_courier import models
from fvh_courier.models.image_note_properties import prefetch_properties

from .serializers import (
    PackageSerializer, OutgoingPackageSerializer, LocationSerializer,
    OSMImageNoteWithPropsSerializer, OSMImageNoteCommentSerializer, OSMEntranceSerializer,
    OSMFeatureSerializer, BaseOSMImageNoteSerializer)
from .permissions import IsCourier, IsReviewer


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
        return self.request.user.delivered_packages.filter(delivered_time__isnull=True)

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
        return self.request.user.delivered_packages.filter(delivered_time__isnull=False)


class PendingOutgoingPackagesViewSet(PackagesViewSetMixin, mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OutgoingPackageSerializer

    def get_base_queryset(self):
        return self.request.user.sent_packages.filter(delivered_time=None)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'])
    def jsonschema(self, request, pk=None):
        return Response(to_jsonschema(self.get_serializer()))


class DeliveredOutgoingPackagesViewSet(PackagesViewSetMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OutgoingPackageSerializer

    def get_base_queryset(self):
        return self.request.user.sent_packages.filter(delivered_time__isnull=False)


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
    serializer_class = OSMImageNoteWithPropsSerializer
    queryset = prefetch_properties(
        models.OSMImageNote.objects.filter(visible=True)
        .prefetch_related('tags', 'osm_features', 'upvotes', 'downvotes', 'comments'))

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
        osm_image_note.reviewed_by = request.user
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
    queryset = models.OSMImageNote.objects.all()
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
