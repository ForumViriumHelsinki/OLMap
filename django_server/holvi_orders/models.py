import uuid

from django.contrib.auth.models import User
from django.db import models


class HolviWebshop(models.Model):
    token = models.UUIDField(default=uuid.uuid4)
    sender = models.ForeignKey(User, related_name='holvi_webshops', on_delete=models.PROTECT)


class HolviOrder(models.Model):
    shop = models.ForeignKey(HolviWebshop, related_name='orders', on_delete=models.PROTECT)
    code = models.CharField(max_length=32, unique=True, primary_key=True)
    pool = models.CharField(max_length=32, blank=True)
    firstname = models.CharField(max_length=32, blank=True)
    lastname = models.CharField(max_length=32, blank=True)
    company = models.CharField(max_length=64, blank=True)
    email = models.CharField(max_length=64, blank=True)
    city = models.CharField(max_length=32, blank=True)
    country = models.CharField(max_length=8, blank=True)
    street = models.CharField(max_length=64, blank=True)
    postcode = models.CharField(max_length=16, blank=True)
    language = models.CharField(max_length=4, blank=True)
    phone = models.CharField(max_length=16, blank=True)
    paid = models.BooleanField(default=False)
    create_time = models.DateTimeField(null=True, blank=True)
    paid_time = models.DateTimeField(null=True, blank=True)

    def sender_address(self):
        return self.shop.sender.address

    def sender(self):
        return self.shop.sender

    def recipient_str(self):
        if self.company:
            return f'{self.firstname} {self.lastname}, {self.company}'
        return f'{self.firstname} {self.lastname}'


class HolviPurchase(models.Model):
    order = models.ForeignKey(HolviOrder, related_name='purchases', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=128)


class HolviPurchaseAnswer(models.Model):
    purchase = models.ForeignKey(HolviPurchase, related_name='answers', on_delete=models.CASCADE)
    label = models.CharField(max_length=128)
    answer = models.CharField(max_length=256)
