from django.db import models
from rest_framework import serializers


class RoundingDecimalField(serializers.DecimalField):
    def validate_precision(self, value):
        return value


serializers.ModelSerializer.serializer_field_mapping[models.DecimalField] = RoundingDecimalField
