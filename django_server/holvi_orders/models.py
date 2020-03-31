import uuid

from django.contrib.auth.models import User
from django.db import models


class HolviWebshop(models.Model):
    token = models.UUIDField(default=uuid.uuid4)
    sender = models.ForeignKey(User, related_name='holvi_webshops', on_delete=models.PROTECT)


class HolviOrder(models.Model):
    shop = models.ForeignKey(HolviWebshop, related_name='orders', on_delete=models.PROTECT)
    code = models.CharField(max_length=32, unique=True, primary_key=True)
    pool = models.CharField(max_length=32)
    firstname = models.CharField(max_length=32)
    lastname = models.CharField(max_length=32)
    company = models.CharField(max_length=64)
    email = models.CharField(max_length=64)
    city = models.CharField(max_length=32)
    country = models.CharField(max_length=8)
    street = models.CharField(max_length=64)
    postcode = models.CharField(max_length=16)
    language = models.CharField(max_length=4)
    phone = models.CharField(max_length=16)
    paid = models.BooleanField()
    create_time = models.DateTimeField()
    paid_time = models.DateTimeField()


class HolviPurchase(models.Model):
    order = models.ForeignKey(HolviOrder, related_name='purchases', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=128)


class HolviPurchaseAnswer(models.Model):
    purchase = models.ForeignKey(HolviPurchase, related_name='answers', on_delete=models.CASCADE)
    label = models.CharField(max_length=128)
    answer = models.CharField(max_length=256)
