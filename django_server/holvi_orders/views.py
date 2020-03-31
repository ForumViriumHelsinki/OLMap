from django.conf import settings
from django.shortcuts import get_object_or_404
from django.urls import path
from rest_framework import permissions
from rest_framework.generics import CreateAPIView
from sentry_sdk import capture_exception

from holvi_orders import models
from holvi_orders.serializers import HolviOrderSerializer
from holvi_orders.signals import order_received


class HolviOrderView(CreateAPIView):
    queryset = models.HolviOrder.objects.all()
    serializer_class = HolviOrderSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        request.data['shop'] = get_object_or_404(models.HolviWebshop, token=self.kwargs['token']).id
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        order = serializer.save()
        try:
            order_received.send(models.HolviOrder, order=order)
        except Exception as e:
            if settings.DEBUG:
                print(e)
            else:
                capture_exception(e)
        return order


urlpatterns = [
    path('holvi_orders/<str:token>/', HolviOrderView.as_view(), name='holvi_order')
]
