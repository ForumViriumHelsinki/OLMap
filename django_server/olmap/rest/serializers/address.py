from rest_framework import serializers
from olmap import models


class AddressAsOSMNodeSerializer(serializers.ModelSerializer):
    type = serializers.ReadOnlyField(default='node')
    tags = serializers.SerializerMethodField()

    class Meta:
        model = models.Address
        fields = ['type', 'id', 'lat', 'lon', 'tags']

    def get_tags(self, address):
        return {
            'addr:street': address.street,
            'addr:housenumber': address.housenumber
        }
