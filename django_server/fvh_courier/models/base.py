from django.db import models


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