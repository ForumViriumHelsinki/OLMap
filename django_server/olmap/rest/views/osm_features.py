from rest_framework import viewsets, permissions
from rest_framework.mixins import RetrieveModelMixin

from olmap import models
from olmap.rest.serializers.osm_features import OSMEntranceSerializer, OSMFeatureSerializer


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


class OSMFeaturesViewSet(RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = models.OSMFeature.objects.all().prefetch_related(
        'workplace_set__image_note',
        'workplace_set__workplace_entrances__entrance__image_note',
        'workplace_set__workplace_entrances__entrance__unloading_places__image_note')
    permission_classes = [permissions.AllowAny]
    serializer_class = OSMFeatureSerializer
