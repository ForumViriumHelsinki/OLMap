from django.contrib.auth.models import User
# from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils.translation import gettext_lazy as _


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BaseLocation(TimestampedModel):
    lat = models.DecimalField(max_digits=11, decimal_places=8)
    lon = models.DecimalField(max_digits=11, decimal_places=8)

    # coordinate = PointField()

    class Meta:
        abstract = True


class UserLocation(BaseLocation):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='location')


class Address(BaseLocation):
    street_address = models.CharField(verbose_name=_('street address'), max_length=128)
    postal_code = models.CharField(verbose_name=_('postal code'), max_length=16)
    city = models.CharField(verbose_name=_('city'), max_length=64)
    country = models.CharField(verbose_name=_('country'), max_length=64)

    class Meta:
        verbose_name = _('address')
        verbose_name_plural = _('addresses')

    def __str__(self):
        return self.street_address


class Package(TimestampedModel):
    pickup_at = models.ForeignKey(Address, verbose_name=_('pickup location'), related_name='outbound_packages',
                                  on_delete=models.PROTECT)
    deliver_to = models.ForeignKey(Address, verbose_name=_('destination'), related_name='inbound_packages',
                                   on_delete=models.PROTECT)

    height = models.PositiveIntegerField(verbose_name=_('height'), help_text=_('in cm'))
    width = models.PositiveIntegerField(verbose_name=_('width'), help_text=_('in cm'))
    depth = models.PositiveIntegerField(verbose_name=_('depth'), help_text=_('in cm'))

    weight = models.DecimalField(verbose_name=_('weight'), help_text=_('in kg'), max_digits=7, decimal_places=2)

    sender = models.ForeignKey(User, verbose_name=_('sender'), related_name='sent_packages', on_delete=models.PROTECT)

    recipient = models.CharField(max_length=128, verbose_name=_('recipient'))
    recipient_phone = models.CharField(max_length=32, verbose_name=_('recipient phone number'))

    courier = models.ForeignKey(User, verbose_name=_('courier'), null=True, blank=True, related_name='delivered_packages',
                                on_delete=models.PROTECT)

    earliest_pickup_time = models.DateTimeField(verbose_name=_('earliest pickup time'))
    latest_pickup_time = models.DateTimeField(verbose_name=_('latest pickup time'))

    earliest_delivery_time = models.DateTimeField(verbose_name=_('earliest delivery time'))
    latest_delivery_time = models.DateTimeField(verbose_name=_('latest delivery time'))

    picked_up_time = models.DateTimeField(verbose_name=_('picked up at'), blank=True, null=True)
    delivered_time = models.DateTimeField(verbose_name=_('delivered at'), blank=True, null=True)

    class Meta:
        verbose_name = _('package')
        verbose_name_plural = _('packages')
        ordering = ['-earliest_pickup_time']

    @classmethod
    def available_packages(cls):
        """
        Return all packages for which delivery has been requested but which are not yet reserved by any courier.
        """
        return cls.objects.filter(courier__isnull=True)


class PhoneNumber(TimestampedModel):
    user = models.ForeignKey(User, related_name='phone_numbers', on_delete=models.CASCADE)
    number = models.CharField(max_length=32, verbose_name=_('phone number'))

    class Meta:
        verbose_name = _('phone number')
        verbose_name_plural = _('phone numbers')
