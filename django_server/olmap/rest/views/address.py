import math

from rest_framework import permissions
from rest_framework.generics import ListAPIView

from olmap import models
from olmap.rest.serializers import AddressAsOSMNodeSerializer


class NearbyAddressesView(ListAPIView):
    serializer_class = AddressAsOSMNodeSerializer
    queryset = models.Address.objects.all()
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