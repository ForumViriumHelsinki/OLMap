from __future__ import annotations

import math
from typing import ClassVar

from rest_framework import permissions
from rest_framework.generics import ListAPIView
from rest_framework.schemas.openapi import AutoSchema

from olmap import models
from olmap.rest.serializers import AddressAsOSMNodeSerializer


class NearbyAddressesView(ListAPIView):
    """
    Returns official address points near a specified coordinate, approximately within 100m distance.
    The addresses are returned in a format compatible with OSM tagging practice.
    """

    schema = AutoSchema(tags=["Addresses"])
    serializer_class = AddressAsOSMNodeSerializer
    queryset = models.Address.objects.all()
    permission_classes: ClassVar = [permissions.AllowAny]

    max_distance_meters = 100
    m_per_lat = 111200

    def get_queryset(self):
        lat = float(self.kwargs["lat"])
        lon = float(self.kwargs["lon"])
        lat_diff = self.max_distance_meters / self.m_per_lat
        lon_diff = lat_diff / abs(math.cos(lat * (math.pi / 180)))
        return self.queryset.filter(
            lat__gt=lat - lat_diff,
            lat__lt=lat + lat_diff,
            lon__gt=lon - lon_diff,
            lon__lt=lon + lon_diff,
        )
