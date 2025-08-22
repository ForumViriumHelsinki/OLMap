import re

from django.db import models
from django.utils.translation import gettext_lazy as _


class Model(models.Model):
    class Meta:
        abstract = True

    def __str__(self):
        return (self.id and f"{self.__class__.__name__}({self.id})") or f"New {self.__class__.__name__}"


class TimestampedModel(Model):
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Address(TimestampedModel):
    street = models.CharField(max_length=64, blank=True)
    housenumber = models.CharField(max_length=8, blank=True, null=True, help_text="E.g. 3-5")

    postal_code = models.CharField(verbose_name=_("postal code"), max_length=16)
    city = models.CharField(verbose_name=_("city"), max_length=64)
    country = models.CharField(verbose_name=_("country"), max_length=64)

    lat = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    lon = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    street_address_regex = re.compile(
        r"^(?P<street>.+?) +(?P<housenumber>[\d\-]+[a-z]?) *((?P<unit>[A-Z]{1,2})[ ,])?.*$"
    )

    class Meta:
        verbose_name = _("address")
        verbose_name_plural = _("addresses")

    def __str__(self):
        return f"{self.street} {self.housenumber}"
