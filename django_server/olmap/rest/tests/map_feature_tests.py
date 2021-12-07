import json

from django.urls import reverse
from rest_framework import status

from .base import FVHAPITestCase
from olmap import models


class OSMMapFeatureTests(FVHAPITestCase):
    maxDiff = None

    def test_save_osm_image_note_with_map_feature(self):
        # Given that a user is signed in
        user = self.create_and_login_user()

        # When requesting to save an OSM image note over ReST, supplying tags and map_features
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

        # And it creates the passed map_features:
        self.assertEqual(note.entrance_set.count(), 1)
        self.assertDictEqual(response.json()['entrance_set'][0]['as_osm_tags'], {
            'addr:street': 'Unioninkatu',
            'addr:housenumber': '24',
            'description': 'With buzzer',
            'access': 'private',
            'width': 0.9,
            'entrance': 'staircase'})

    def test_save_osm_image_note_with_empty_map_feature_list(self):
        # Given that a user is signed in
        user = self.create_and_login_user()

        # When requesting to save an OSM image note over ReST, supplying an empty list of map_features
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

    def test_update_osm_image_note_map_features(self):
        # Given that a user is signed in
        user = self.create_and_login_user()

        # And given a successfully created OSM image note with some saved map_features
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188',
                                                  created_by=user)
        note.entrance_set.create(**{
            'street': 'Unioninkatu',
            'housenumber': '24',
            'access': 'private',
            'width': '0.9',
            'buzzer': True,
            'type': 'staircase'})

        # When requesting to update an OSM image note over ReST, giving a list of map_features
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

        # And the map_features have been changed:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.entrance_set.values_list('street', flat=True)), set(['Bulevardi']))

    def test_osm_image_note_map_feature_schemas(self):
        # Given that a user is signed in
        self.create_and_login_user()

        # When requesting the image note map_feature type schemas
        url = reverse('osmimagenote-map-feature-schemas')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains schemas to create the different types of OSM features:
        osm_feature_field = {'osm_feature': {
            "type": "integer",
            "title": "Osm feature"
        }}

        address_fields = {
            'street': {'type': 'string', 'maxLength': 64, 'title': 'Street'},
            'housenumber': {
                'type': ['string', 'null'],
                'maxLength': 8,
                'title': 'Housenumber',
                'description': 'E.g. 3-5'},
            'unit': {'type': 'string', 'maxLength': 8, 'title': 'Unit'}
        }

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
            'opening_hours': {'type': 'string', 'maxLength': 64, 'title': 'Opening hours',
                              'description': 'E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00'},
        }

        data = response.json()
        workplace = data['Workplace']['properties']
        workplace_type = workplace['type']

        for (k, v) in {
            'Entrance': {
                'type': 'object',
                'properties': dict(address_fields, **lockable_fields, **osm_feature_field, **{
                    'type': {
                        'type': 'string',
                        'enum': ['', 'workplace', 'main', 'secondary', 'service', 'staircase', 'garage', 'other'],
                        'title': 'Type'},
                    "description": {
                        "type": "string",
                        "maxLength": 96,
                        "title": "Description"
                    },
                    'wheelchair': {'type': ['boolean', 'null'], 'title': 'Wheelchair'},
                    'loadingdock': {'type': 'boolean', 'title': 'Loadingdock'},
                })},

            'Steps': {
                'type': 'object',
                'properties': dict(osm_feature_field, **{
                    'step_count': {'type': ['integer', 'null'], 'minimum': 0, 'maximum': 32767, 'title': 'Step count'},
                    'handrail': {'type': ['boolean', 'null'], 'title': 'Handrail'},
                    'ramp': {'type': ['boolean', 'null'], 'title': 'Ramp'},
                    'width': dict(dimension_field, title='Width'),
                    'incline': {
                        'type': 'string',
                        'enum': ['', 'up', 'down'],
                        'title': 'Incline',
                        'description': 'From street level'},
                })},

            'Gate': {
                'type': 'object',
                'properties': dict(lockable_fields, lift_gate={'type': 'boolean', 'title': 'Lift gate'}, **osm_feature_field)},

            'Barrier': {
                'type': 'object',
                'properties': dict(osm_feature_field, **{
                    'type': {'type': 'string', 'enum': ['', 'fence', 'wall', 'block', 'bollard'], 'title': 'Type'}})},


            'Workplace': {
                'type': 'object',
                'required': ['type'],
                'properties': dict(address_fields, **osm_feature_field, **{
                    'name': {'type': 'string', 'maxLength': 64, 'title': 'Name'},
                    "url_name": {
                        "type": "string",
                        "maxLength": 32,
                        "title": "Url name",
                        "description": "Use only letters, numbers and underscores"
                    },
                    'phone': {'type': 'string', 'maxLength': 32, 'title': 'Phone'},
                    'opening_hours': {'type': 'string', 'maxLength': 64, 'title': 'Opening hours',
                                      'description': 'E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00'},
                    'opening_hours_covid19': {'type': 'string', 'maxLength': 64, 'title': 'Opening hours covid19'},
                    'level': {'type': 'string', 'maxLength': 8, 'title': 'Level', 'description': 'Floor(s), e.g. 1-3'},
                    'type': {'type': 'integer', 'enum': workplace_type['enum'], 'enumNames': workplace_type['enumNames'], 'title': 'Type'},
                    "delivery_hours": {
                        "type": "string",
                        "maxLength": 64,
                        "title": "Delivery hours",
                        'description': 'E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00'

                    },
                    "delivery_instructions": {
                        "type": "string",
                        "title": "Delivery instructions"
                    },
                    'max_vehicle_height': dict(dimension_field, title='Max vehicle height'),
                    'workplace_entrances': workplace['workplace_entrances']
                })},

            'InfoBoard': {
                'type': 'object',
                'properties': dict(osm_feature_field, **{
                    'type': {'type': 'string', 'enum': ['', 'map', 'board'], 'title': 'Type'}})

            },

            'TrafficSign': {
                'type': 'object',
                'properties': dict(osm_feature_field, **{
                    'type': {
                        'type': 'string',
                        'enum': ['', 'Max height', 'Max weight', 'No stopping', 'No parking', 'Loading zone', 'Parking'],
                        'title': 'Type'},
                    'text': {'type': 'string', 'maxLength': 128, 'title': 'Text'}})
            },

            "UnloadingPlace": {
                "type": "object",
                "properties": dict(osm_feature_field, **{
                    "length": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "pattern": "^\\-?[0-9]*(\\.[0-9]{1,2})?$",
                        "title": "Length",
                        "description": "In meters"
                    },
                    "width": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "pattern": "^\\-?[0-9]*(\\.[0-9]{1,2})?$",
                        "title": "Width",
                        "description": "In meters"
                    },
                    "max_weight": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "pattern": "^\\-?[0-9]*(\\.[0-9]{1,2})?$",
                        "title": "Max weight",
                        "description": "In tons"
                    },
                    "description": {
                        "type": "string",
                        "title": "Description"
                    },
                    "opening_hours": {
                        "type": "string",
                        "maxLength": 64,
                        "title": "Opening hours",
                        'description': 'E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00'
                    },
                    "entrances": {
                        "type": "array",
                        "items": {
                            "type": "integer"
                        },
                        "title": "Entrances"
                    }
                })
            }
        }.items():
            try:
                self.assertDictEqual(data[k], v)
            except AssertionError:
                print(json.dumps(data[k], indent=2))
                raise
