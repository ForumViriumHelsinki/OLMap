from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import gettext_lazy as _

from .base import TimestampedModel


class PhoneNumber(TimestampedModel):
    user = models.ForeignKey(User, related_name='phone_numbers', on_delete=models.CASCADE)
    number = models.CharField(max_length=32, verbose_name=_('phone number'))

    class Meta:
        verbose_name = _('phone number')
        verbose_name_plural = _('phone numbers')