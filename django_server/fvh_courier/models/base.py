import re

import geocoder
from django.db import models
from django.utils.translation import gettext_lazy as _


class Model(models.Model):
    class Meta:
        abstract = True

    def __str__(self):
        return (self.id and f'{self.__class__.__name__}({self.id})') or f'New {self.__class__.__name__}'


class TimestampedModel(Model):
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BaseAddress(TimestampedModel):
    street_address = models.CharField(verbose_name=_('street address'), max_length=128)
    postal_code = models.CharField(verbose_name=_('postal code'), max_length=16)
    city = models.CharField(verbose_name=_('city'), max_length=64)
    country = models.CharField(verbose_name=_('country'), max_length=64)

    lat = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    lon = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.street_address

    def with_latlng(self):
        if self.lat and self.lon:
            return self
        [self.lat, self.lon] = geocoder.osm(f'{self.building_address()}, {self.city}').latlng
        self.save()
        return self

    def building_address(self):
        return re.sub(r'(\d+).*?$', r'\1', self.street_address)


class Address(BaseAddress):
    class Meta:
        verbose_name = _('address')
        verbose_name_plural = _('addresses')