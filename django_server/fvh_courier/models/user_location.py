from django.contrib.auth.models import User
from django.db import models

from .base import BaseLocation


class UserLocation(BaseLocation):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='location')
