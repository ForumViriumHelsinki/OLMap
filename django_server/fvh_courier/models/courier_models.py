from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import gettext_lazy as _

from .base import TimestampedModel, Address, BaseLocation


class CourierCompany(TimestampedModel):
    name = models.CharField(max_length=64)
    coordinator = models.ForeignKey('Courier', related_name='is_coordinator_for', null=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.name or super().__str__()

    @classmethod
    def notify_new_package(cls, package):
        from fvh_courier.models import PackageSMS
        try:
            number = package.courier_company.coordinator.phone_number
        except AttributeError:
            return
        PackageSMS.send_message(package, 'courier_notification', number)


class UserRoleManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('user')


class UserRole(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=32, verbose_name=_('phone number'))

    objects = UserRoleManager()

    class Meta:
        abstract = True

    def get_full_name(self):
        return self.user.get_full_name()

    def __str__(self):
        # Avoid doing a separate db query just to represent object as string:
        if self.__class__.user.is_cached(self):
            return self.get_full_name()
        else:
            return super().__str__()


class Courier(UserRole, BaseLocation):
    company = models.ForeignKey(CourierCompany, related_name='couriers', on_delete=models.CASCADE)


class Sender(UserRole):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    address = models.ForeignKey(Address, on_delete=models.PROTECT)
    courier_company = models.ForeignKey(CourierCompany, null=True, on_delete=models.SET_NULL, related_name='senders')
