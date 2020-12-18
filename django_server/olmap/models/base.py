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
    street = models.CharField(max_length=64, blank=True)
    housenumber = models.CharField(max_length=8, blank=True, null=True, help_text='E.g. 3-5')
    unit = models.CharField(max_length=8, blank=True)

    street_address = models.CharField(verbose_name=_('street address'), max_length=128)
    postal_code = models.CharField(verbose_name=_('postal code'), max_length=16)
    city = models.CharField(verbose_name=_('city'), max_length=64)
    country = models.CharField(verbose_name=_('country'), max_length=64)

    lat = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    lon = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    street_address_regex = re.compile(r'^(?P<street>.+?) +(?P<housenumber>[\d\-]+[a-z]?) *((?P<unit>[A-Z]{1,2})[ ,])?.*$')

    class Meta:
        abstract = True

    def __str__(self):
        return self.street_address

    def save(self, *args, **kwargs):
        self.sync_street_address()
        return super().save(*args, **kwargs)

    def sync_street_address(self):
        if self.street_address:
            match = re.fullmatch(self.street_address_regex, self.street_address)
            if match and not self.street:
                self.street = match.group('street')
                self.housenumber = match.group('housenumber')
                self.unit = match.group('unit') or ''
        elif self.street and self.housenumber:
            self.street_address = f'{self.street} {self.housenumber} {self.unit or ""}'.strip()

    def with_latlng(self, default=None):
        if self.lat and self.lon:
            return self
        official = Address.objects.filter(
            official=True, street=self.street, housenumber=self.housenumber, postal_code=self.postal_code
        ).first()
        if official:
            [self.lat, self.lon] = [official.lat, official.lon]
        else:
            latlng = geocoder.osm(f'{self.building_address()}, {self.city}').latlng
            if latlng:
                [self.lat, self.lon] = latlng
            elif default:
                [self.lat, self.lon] = [default.lat, default.lon]
        self.save()
        return self

    def building_address(self):
        return re.sub(r'(\d+).*?$', r'\1', self.street_address)


class Address(BaseAddress):
    official = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('address')
        verbose_name_plural = _('addresses')