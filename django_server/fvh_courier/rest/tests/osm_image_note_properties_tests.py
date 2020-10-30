from django.urls import reverse
from rest_framework import status

from .base import FVHAPITestCase
from fvh_courier import models


class OSMImageNotePropertiesTests(FVHAPITestCase):
    def test_save_osm_image_note_with_property(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # When requesting to save an OSM image note over ReST, supplying tags and properties
        url = reverse('osmimagenote-list')
        fields = {
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view',
            'osm_features': [3330783778, 3336789583, 3330783754],
            'tags': ['Entrance'],
            'entrance_set': [{
                'street': 'Unioninkatu',
                'housenumber': '24',
                'access': 'private',
                'width': '0.9',
                'buzzer': True,
                'type': 'staircase'
            }]
        }
        response = self.client.post(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        note = models.OSMImageNote.objects.get()

        # And it creates any passed tags:
        self.assertSetEqual(set(note.tags), set(fields['tags']))

        # And it creates the passed properties:
        self.assertEqual(note.entrance_set.count(), 1)
        self.assertDictEqual(response.json()['entrance_set'][0]['as_osm_tags'], {
            'addr:street': 'Unioninkatu',
            'addr:housenumber': '24',
            'description': 'With buzzer',
            'access': 'private',
            'width': 0.9,
            'entrance': 'staircase'})

    def test_save_osm_image_note_with_empty_property_list(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # When requesting to save an OSM image note over ReST, supplying an empty list of properties
        url = reverse('osmimagenote-list')
        fields = {
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view',
            'entrance_set': []
        }
        response = self.client.post(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        note = models.OSMImageNote.objects.get()

    def test_update_osm_image_note_properties(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # And given a successfully created OSM image note with some saved properties
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188',
                                                  created_by=courier.user)
        note.entrance_set.create(**{
            'street': 'Unioninkatu',
            'housenumber': '24',
            'access': 'private',
            'width': '0.9',
            'buzzer': True,
            'type': 'staircase'})

        # When requesting to update an OSM image note over ReST, giving a list of properties
        # conflicting with the existing ones
        url = reverse('osmimagenote-detail', kwargs={'pk': note.id})
        fields = {
            'entrance_set': [{
                'street': 'Bulevardi',
                'housenumber': '31',
                'access': 'private',
                'type': 'service'}]}
        response = self.client.patch(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the properties have been changed:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.entrance_set.values_list('street', flat=True)), set(['Bulevardi']))

    def test_osm_image_note_property_schemas(self):
        # Given that a user is signed in
        self.create_and_login_courier()

        # When requesting the image note property type schemas
        url = reverse('osmimagenote-property-schemas')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains schemas to create the different types of OSM features:
        address_fields = {
            'street': {'type': 'string', 'maxLength': 64, 'title': 'Street'},
            'housenumber': {
                'type': ['string', 'null'],
                'maxLength': 8,
                'title': 'Housenumber',
                'description': 'E.g. 3-5'},
            'unit': {'type': 'string', 'maxLength': 8, 'title': 'Unit'}
        }

        company_fields = dict(address_fields, **{
            'name': {'type': 'string', 'maxLength': 64, 'title': 'Name'},
            'phone': {'type': 'string', 'maxLength': 32, 'title': 'Phone'},
            'opening_hours': {'type': 'string', 'maxLength': 64, 'title': 'Opening hours'},
            'opening_hours_covid19': {'type': 'string', 'maxLength': 64, 'title': 'Opening hours covid19'},
            'level': {'type': 'string', 'maxLength': 8, 'title': 'Level', 'description': 'Floor(s), e.g. 1-3'}})

        dimension_field = {
            'type': ['string', 'null'],
            'pattern': '^\\-?[0-9]*(\\.[0-9]{1,2})?$',
            'title': 'Width',
            'description': 'In meters'}

        lockable_fields = {
            'access': {
                'type': 'string',
                'enum': ['', 'yes', 'private', 'delivery', 'no'],
                'title': 'Access'},
            'width': dict(dimension_field, title='Width'),
            'height': dict(dimension_field, title='Height'),
            'buzzer': {'type': ['boolean', 'null'], 'title': 'Buzzer'},
            'keycode': {'type': ['boolean', 'null'], 'title': 'Keycode'},
            'phone': {'type': 'string', 'maxLength': 32, 'title': 'Phone'},
            'opening_hours': {'type': 'string', 'maxLength': 64, 'title': 'Opening hours'},
        }

        self.assertDictEqual(response.json(), {
            'Entrance': {
                'type': 'object',
                'properties': dict(address_fields, **lockable_fields, **{
                    'type': {
                        'type': 'string',
                        'enum': ['', 'main', 'secondary', 'service', 'staircase', 'garage'],
                        'title': 'Type'},
                    'wheelchair': {'type': ['boolean', 'null'], 'title': 'Wheelchair'},
                    'loadingdock': {'type': 'boolean', 'title': 'Loadingdock'},
                })},

            'Steps': {
                'type': 'object',
                'properties': {
                    'step_count': {'type': ['integer', 'null'], 'minimum': 0, 'maximum': 32767, 'title': 'Step count'},
                    'handrail': {'type': ['boolean', 'null'], 'title': 'Handrail'},
                    'ramp': {'type': ['boolean', 'null'], 'title': 'Ramp'},
                    'width': dict(dimension_field, title='Width'),
                    'incline': {
                        'type': 'string',
                        'enum': ['', 'up', 'down'],
                        'title': 'Incline',
                        'description': 'From street level'},
                }},

            'Gate': {
                'type': 'object',
                'properties': dict(lockable_fields, lift_gate={'type': 'boolean', 'title': 'Lift gate'})},

            'Barrier': {
                'type': 'object',
                'properties': {
                    'type': {'type': 'string', 'enum': ['', 'fence', 'wall', 'block', 'bollard'], 'title': 'Type'}}},

            'Office': {
                'type': 'object',
                'properties': dict(company_fields, **{
                    'type': {
                        'type': 'string',
                        'enum': ['', 'association', 'company', 'diplomatic', 'educational_institution', 'government'],
                        'title': 'Type'}})},

            'Shop': {
                'type': 'object',
                'properties': dict(company_fields, **{
                    'type': {
                        'type': 'string', 'maxLength': 32, 'title': 'Type',
                        'description': 'See https://wiki.openstreetmap.org/wiki/Key:shop'}})},

            'Amenity': {
                'type': 'object',
                'properties': dict(company_fields, **{
                    'delivery_covid19': {'type': 'string', 'maxLength': 64, 'title': 'Delivery covid19'},
                    'takeaway_covid19': {'type': 'string', 'maxLength': 64, 'title': 'Takeaway covid19'},
                    'type': {
                        'type': 'string', 'maxLength': 32, 'minLength': 1, 'title': 'Type',
                        'description': 'See https://wiki.openstreetmap.org/wiki/Key:amenity'}}),
                'required': ['type']},

            'InfoBoard': {
                'type': 'object',
                'properties': {'type': {'type': 'string', 'enum': ['', 'map', 'board'], 'title': 'Type'}}

            },

            'TrafficSign': {
                'type': 'object',
                'properties': {
                    'type': {
                        'type': 'string',
                        'enum': ['', 'Max height', 'Max weight', 'No stopping', 'No parking', 'Loading zone', 'Parking'],
                        'title': 'Type'},
                    'text': {'type': 'string', 'maxLength': 128, 'title': 'Text'}}}
        })

