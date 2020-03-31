from django.shortcuts import get_object_or_404
from django.urls import path
from rest_framework import permissions
from rest_framework.generics import CreateAPIView

from holvi_orders import models
from holvi_orders.serializers import HolviOrderSerializer


class HolviOrderView(CreateAPIView):
    queryset = models.HolviOrder.objects.all()
    serializer_class = HolviOrderSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        request.data['shop'] = get_object_or_404(models.HolviWebshop, token=self.kwargs['token']).id
        return super().create(request, *args, **kwargs)


urlpatterns = [
    path('holvi_orders/<str:token>/', HolviOrderView.as_view(), name='holvi_order')
]
