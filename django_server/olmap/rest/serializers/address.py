from rest_framework import serializers
from olmap import models


class AddressAsOSMNodeSerializer(serializers.ModelSerializer):
    type = serializers.ReadOnlyField(
        default='node', help_text='Provided to enable compatibility with OSM nodes; value is always node.')
    tags = serializers.SerializerMethodField(
        help_text='Object containing the address as OSM-compatible tags.',
        default={'addr:street': '', 'addr:housenumber': ''})

    class Meta:
        model = models.Address
        fields = ['type', 'id', 'lat', 'lon', 'tags']

    def get_tags(self, address):
        return {
            'addr:street': address.street,
            'addr:housenumber': address.housenumber
        }
