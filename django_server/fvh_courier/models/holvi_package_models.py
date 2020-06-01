import datetime
import re

from django.db import models
from django.utils import timezone

from fvh_courier.models import Package, Address, CourierCompany
from holvi_orders.models import HolviWebshop
from holvi_orders.signals import order_received


class IgnoredHolviProduct(models.Model):
    """
    Use this model to mark products in a Holvi webshop that should not be delivered through OLMap.
    If a Holvi order contains only ignored products, then no package should be generated for it.
    """
    holvi_shop = models.ForeignKey(HolviWebshop, on_delete=models.CASCADE, related_name='ignored_products')
    name = models.CharField(max_length=128)

    @classmethod
    def names_for_order(cls, order):
        return cls.objects.filter(holvi_shop=order.shop_id).values_list('name', flat=True)


class RequiredHolviProduct(models.Model):
    """
    Use this model to identify a product in a Holvi webshop that marks an order for delivery through OLMap.
    If a Holvi order for a shop with a RequiredHolviProduct does not contain this product, then no
    package should be generated for it.
    """
    holvi_shop = models.OneToOneField(HolviWebshop, on_delete=models.CASCADE, related_name='required_product')
    name = models.CharField(max_length=128)

    @classmethod
    def name_for_order(cls, order):
        return cls.objects.filter(holvi_shop=order.shop_id).values_list('name', flat=True).first()


class HolviPackage(models.Model):
    package = models.OneToOneField(Package, on_delete=models.CASCADE)
    order = models.OneToOneField('holvi_orders.HolviOrder', on_delete=models.CASCADE)

    delivery_products = ['Kotiinkuljetus', 'Home delivery', 'ILMAINEN KOTIINKULJETUS']
    instruction_regex = re.compile('Delivery instructions|Ohjeet kuljettajalle', re.IGNORECASE)

    minute_limits = {
        'pickup': [20, 40],
        'delivery': [20, 60]
    }

    @classmethod
    def create_package_for_order(cls, order):
        if cls.order_needs_delivery(order):
            return cls(order=order).create_package()

    @classmethod
    def order_needs_delivery(cls, order):
        required_product = RequiredHolviProduct.name_for_order(order)
        if required_product:
            found = False
            for p in order.purchases.all():
                if p.product_name == required_product:
                    found = True
                    break
            if not found:
                return False

        purchases = [p for p in order.purchases.all()
                     if p.product_name not in IgnoredHolviProduct.names_for_order(order)]

        return len(purchases) > 0

    def create_package(self):
        delivery_instructions = ''
        details = ''
        purchases = [p for p in self.order.purchases.all()
                     if p.product_name not in IgnoredHolviProduct.names_for_order(self.order)]

        for p in purchases:
            details += p.product_name
            for a in p.answers.all():
                if a.answer:
                    details += f'\n  {a.label}:\n  {a.answer}'
                    if re.search(self.instruction_regex, a.label):
                        delivery_instructions += a.answer
            details += '\n'

        meals = len(purchases)
        sender_user = self.order.sender()
        sender = sender_user.sender
        self.package = Package.objects.create(
            name=f'{meals} item{meals > 1 and "s" or ""} to {self.order.recipient_str()}'[:64],
            details=details,
            delivery_instructions=delivery_instructions,
            pickup_at=sender.address,
            deliver_to=Address.objects.get_or_create(
                street_address=self.order.street,
                city=self.order.city,
                postal_code=self.order.postcode,
                country=self.order.country
            )[0].with_latlng(),
            sender=sender,
            courier_company=sender.courier_company,
            recipient=self.order.recipient_str(),
            recipient_phone=self.order.phone,
            earliest_pickup_time=timezone.now() + datetime.timedelta(minutes=self.minute_limits['pickup'][0]),
            latest_pickup_time=timezone.now() + datetime.timedelta(minutes=self.minute_limits['pickup'][1]),

            earliest_delivery_time=timezone.now() + datetime.timedelta(minutes=self.minute_limits['delivery'][0]),
            latest_delivery_time=timezone.now() + datetime.timedelta(minutes=self.minute_limits['delivery'][1]))
        self.save()
        CourierCompany.notify_new_package(self.package)
        return self.package


def on_order_received(sender, order=None, **kwargs):
    HolviPackage.create_package_for_order(order)


order_received.connect(on_order_received)
