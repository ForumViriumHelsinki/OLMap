from __future__ import annotations

from typing import ClassVar

from rest_framework import permissions, viewsets
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.schemas.openapi import AutoSchema

from olmap import models
from olmap.rest.serializers.osm_features import OSMFeatureSerializer


class OSMFeaturesViewSet(RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Returns any OLMap image notes and/or workplaces associated with particular OSM features, identified by the
    feature ID in OSM. Note that this API does not currently differentiate between ways, relations and nodes,
    so ID clashes are possible.
    """

    schema = AutoSchema(tags=["OSM Features"])
    queryset = models.OSMFeature.objects.all().prefetch_related(
        "workplace_set__image_note",
        "workplace_set__workplace_entrances__entrance__image_note",
        "workplace_set__workplace_entrances__entrance__unloading_places__image_note",
    )
    permission_classes: ClassVar = [permissions.AllowAny]
    serializer_class = OSMFeatureSerializer
