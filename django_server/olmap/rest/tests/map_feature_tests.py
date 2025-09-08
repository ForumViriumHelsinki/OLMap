import json

from django.urls import reverse
from rest_framework import status

from olmap import models

from ..serializers.workplace_wizard import example_workplace
from .base import FVHAPITestCase


class OSMMapFeatureTests(FVHAPITestCase):
    maxDiff = None

    def test_save_osm_image_note_with_map_feature(self):
        # Given that a user is signed in
        self.create_and_login_user()

        # When requesting to save an OSM image note over ReST, supplying tags and map_features
        url = reverse("osmimagenote-list")
        fields = {
            "lat": "60.16134701761975",
            "lon": "24.944593941327188",
            "comment": "Nice view",
            "osm_features": [3330783778, 3336789583, 3330783754],
            "tags": ["Entrance"],
            "entrance_set": [
                {
                    "street": "Unioninkatu",
                    "housenumber": "24",
                    "access": "private",
                    "width": "0.9",
                    "buzzer": True,
                    "type": "staircase",
                    "layer": -1,
                }
            ],
        }
        response = self.client.post(url, data=fields, format="json")

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        note = models.OSMImageNote.objects.get()

        # And any passed layer info is saved to the note:
        self.assertEqual(note.layer, -1)

        # And it creates any passed tags:
        self.assertSetEqual(set(note.tags), set(fields["tags"]))

        # And it creates the passed map_features:
        self.assertEqual(note.entrance_set.count(), 1)
        self.assertDictEqual(
            response.json()["entrance_set"][0]["as_osm_tags"],
            {
                "addr:street": "Unioninkatu",
                "addr:housenumber": "24",
                "description": "With buzzer",
                "access": "private",
                "width": 0.9,
                "layer": -1,
                "entrance": "staircase",
            },
        )

    def test_save_osm_image_note_with_empty_map_feature_list(self):
        # Given that a user is signed in
        self.create_and_login_user()

        # When requesting to save an OSM image note over ReST, supplying an empty list of map_features
        url = reverse("osmimagenote-list")
        fields = {"lat": "60.16134701761975", "lon": "24.944593941327188", "comment": "Nice view", "entrance_set": []}
        response = self.client.post(url, data=fields, format="json")

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        models.OSMImageNote.objects.get()

    def test_update_osm_image_note_map_features(self):
        # Given that a user is signed in
        user = self.create_and_login_user()

        # And given a successfully created OSM image note with some saved map_features
        note = models.OSMImageNote.objects.create(lat="60.16134701761975", lon="24.944593941327188", created_by=user)
        note.entrance_set.create(
            **{
                "street": "Unioninkatu",
                "housenumber": "24",
                "access": "private",
                "width": "0.9",
                "buzzer": True,
                "type": "staircase",
            }
        )

        # When requesting to update an OSM image note over ReST, giving a list of map_features
        # conflicting with the existing ones
        url = reverse("osmimagenote-detail", kwargs={"pk": note.id})
        fields = {
            "entrance_set": [
                {"street": "Bulevardi", "housenumber": "31", "access": "private", "layer": -1, "type": "service"}
            ]
        }
        response = self.client.patch(url, data=fields, format="json")

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the map_features have been changed:
        note = models.OSMImageNote.objects.get()
        self.assertSetEqual(set(note.entrance_set.values_list("street", flat=True)), {"Bulevardi"})

        # And any passed layer info is saved to the note:
        self.assertEqual(note.layer, -1)

    def test_osm_image_note_map_feature_schemas(self):
        # Given that a user is signed in
        self.create_and_login_user()

        # When requesting the image note map_feature type schemas
        url = reverse("osmimagenote-map-feature-schemas")
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains schemas to create the different types of OSM features:
        osm_feature_field = {"osm_feature": {"type": "integer", "title": "Osm feature"}}

        address_fields = {
            "street": {"type": "string", "maxLength": 64, "title": "Street"},
            "housenumber": {
                "type": ["string", "null"],
                "maxLength": 8,
                "title": "Housenumber",
                "description": "E.g. 3-5",
            },
            "unit": {"type": "string", "maxLength": 8, "title": "Unit"},
        }

        dimension_field = {
            "type": ["string", "null"],
            "pattern": "^\\-?[0-9]*(\\.[0-9]{1,2})?$",
            "title": "Width",
            "description": "In meters",
        }

        lockable_fields = {
            "access": {"type": "string", "enum": ["", "yes", "private", "delivery", "no"], "title": "Access"},
            "width": dict(dimension_field, title="Width"),
            "height": dict(dimension_field, title="Height"),
            "buzzer": {"type": ["boolean", "null"], "title": "Buzzer"},
            "keycode": {"type": ["boolean", "null"], "title": "Keycode"},
            "phone": {"type": "string", "maxLength": 32, "title": "Phone"},
            "opening_hours": {
                "type": "string",
                "maxLength": 256,
                "title": "Opening hours",
                "description": "E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00",
            },
            "layer": {
                "description": "Map layer, e.g. -1 if underground",
                "maximum": 2147483647,
                "minimum": -2147483648,
                "title": "Layer",
                "type": ["integer", "null"],
            },
        }

        data = response.json()
        workplace = data["Workplace"]["properties"]
        workplace_type = workplace["type"]

        for k, v in {
            "Entrance": {
                "type": "object",
                "properties": dict(
                    address_fields,
                    **lockable_fields,
                    **osm_feature_field,
                    **{
                        "type": {
                            "type": "string",
                            "enum": ["", "workplace", "main", "secondary", "service", "staircase", "garage", "other"],
                            "title": "Type",
                        },
                        "description": {"type": "string", "maxLength": 96, "title": "Description"},
                        "wheelchair": {"type": ["boolean", "null"], "title": "Wheelchair"},
                        "loadingdock": {"type": "boolean", "title": "Loadingdock"},
                    },
                ),
            },
            "Steps": {
                "type": "object",
                "properties": dict(
                    osm_feature_field,
                    **{
                        "step_count": {
                            "type": ["integer", "null"],
                            "minimum": 0,
                            "maximum": 32767,
                            "title": "Step count",
                        },
                        "handrail": {"type": ["boolean", "null"], "title": "Handrail"},
                        "ramp": {"type": ["boolean", "null"], "title": "Ramp"},
                        "width": dict(dimension_field, title="Width"),
                        "incline": {
                            "type": "string",
                            "enum": ["", "up", "down"],
                            "title": "Incline",
                            "description": "From street level",
                        },
                    },
                ),
            },
            "Gate": {
                "type": "object",
                "properties": dict(
                    lockable_fields,
                    lift_gate={"type": "boolean", "title": "Lift gate"},
                    ref={"maxLength": 8, "title": "Ref", "type": "string"},
                    **osm_feature_field,
                ),
            },
            "Barrier": {
                "type": "object",
                "properties": dict(
                    osm_feature_field,
                    **{"type": {"type": "string", "enum": ["", "fence", "wall", "block", "bollard"], "title": "Type"}},
                ),
            },
            "Workplace": {
                "type": "object",
                "required": ["type"],
                "properties": dict(
                    address_fields,
                    **osm_feature_field,
                    **{
                        "name": {"type": "string", "maxLength": 64, "title": "Name"},
                        "phone": {"type": "string", "maxLength": 32, "title": "Phone"},
                        "opening_hours": {
                            "type": "string",
                            "maxLength": 256,
                            "title": "Opening hours",
                            "description": "E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00",
                        },
                        "opening_hours_covid19": {"type": "string", "maxLength": 64, "title": "Opening hours covid19"},
                        "level": {
                            "type": "string",
                            "maxLength": 8,
                            "title": "Level",
                            "description": "Floor(s), e.g. 1-3",
                        },
                        "type": {
                            "type": "integer",
                            "enum": workplace_type["enum"],
                            "enumNames": workplace_type["enumNames"],
                            "title": "Type",
                        },
                        "delivery_hours": {
                            "type": "string",
                            "maxLength": 64,
                            "title": "Delivery hours",
                            "description": "E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00",
                        },
                        "delivery_instructions": {"type": "string", "title": "Delivery instructions"},
                        "max_vehicle_height": dict(dimension_field, title="Max vehicle height"),
                        "workplace_entrances": workplace["workplace_entrances"],
                    },
                ),
            },
            "InfoBoard": {
                "type": "object",
                "properties": dict(
                    osm_feature_field, **{"type": {"type": "string", "enum": ["", "map", "board"], "title": "Type"}}
                ),
            },
            "TrafficSign": {
                "type": "object",
                "properties": dict(
                    osm_feature_field,
                    **{
                        "type": {
                            "type": "string",
                            "enum": [
                                "",
                                "Max height",
                                "Max weight",
                                "No stopping",
                                "No parking",
                                "Loading zone",
                                "Parking",
                            ],
                            "title": "Type",
                        },
                        "text": {"type": "string", "maxLength": 128, "title": "Text"},
                    },
                ),
            },
            "UnloadingPlace": {
                "type": "object",
                "properties": dict(
                    osm_feature_field,
                    **{
                        "length": {
                            "type": ["string", "null"],
                            "pattern": "^\\-?[0-9]*(\\.[0-9]{1,2})?$",
                            "title": "Length",
                            "description": "In meters",
                        },
                        "width": {
                            "type": ["string", "null"],
                            "pattern": "^\\-?[0-9]*(\\.[0-9]{1,2})?$",
                            "title": "Width",
                            "description": "In meters",
                        },
                        "max_weight": {
                            "type": ["string", "null"],
                            "pattern": "^\\-?[0-9]*(\\.[0-9]{1,2})?$",
                            "title": "Max weight",
                            "description": "In tons",
                        },
                        "description": {"type": "string", "title": "Description"},
                        "opening_hours": {
                            "type": "string",
                            "maxLength": 256,
                            "title": "Opening hours",
                            "description": "E.g. Mo-Fr 08:00-12:00; Sa 10:00-12:00",
                        },
                        "layer": {
                            "description": "Map layer, e.g. -1 if underground",
                            "maximum": 2147483647,
                            "minimum": -2147483648,
                            "title": "Layer",
                            "type": ["integer", "null"],
                        },
                        "entrances": {"type": "array", "items": {"type": "integer"}, "title": "Entrances"},
                    },
                ),
            },
        }.items():
            try:
                self.assertDictEqual(data[k], v)
            except AssertionError:
                raise

    def test_create_workplace(self):
        url = reverse("workplace-list")
        data = {
            "lat": 60.16612772,
            "lon": 24.9494173,
            "street": "Fabianinkatu",
            "housenumber": "4",
            "unit": "",
            "osm_feature": 4692013476,
            "workplace_entrances": [
                {
                    "lat": 60.16607918,
                    "lon": 24.94928504,
                    "osm_feature": 7271539738,
                    "deliveries": "main",
                    "unloading_places": [
                        {
                            "lat": 60.16605062,
                            "lon": 24.94917032,
                            "access_points": [{"lat": 60.16564102824166, "lon": 24.949258097797674}],
                        },
                        {"lat": 60.16567318, "lon": 24.94917348, "access_points": []},
                    ],
                }
            ],
            "name": "Zucchini",
            "delivery_instructions": "Pienet toimitukset voi tuoda pääovesta, isommat kannattaa tuoda sisäpihan kautta.",
        }

        # When POSTing data for a new workplace, along with entrances, unloading places and access points:
        response = self.client.post(url, json.dumps(data), content_type="application/json")

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)

        # And the response contains the created workplace, entrances, unloading places and access points:
        r = response.json()
        self.assert_dict_contains(
            r,
            {
                "lat": 60.16612772,
                "lon": 24.9494173,
                "street": "Fabianinkatu",
                "housenumber": "4",
                "osm_feature": 4692013476,
                "name": "Zucchini",
                "delivery_instructions": "Pienet toimitukset voi tuoda pääovesta, isommat kannattaa tuoda sisäpihan kautta.",
            },
        )

        entrances = r.get("workplace_entrances", [])
        self.assertEqual(len(entrances), 1)
        self.assert_dict_contains(
            entrances[0], {"lat": 60.16607918, "lon": 24.94928504, "osm_feature": 7271539738, "deliveries": "main"}
        )

        unloading_places = entrances[0].get("unloading_places", [])
        self.assertEqual(len(unloading_places), 2)

        self.assert_dict_contains(
            unloading_places[0],
            {
                "lat": 60.16605062,
                "lon": 24.94917032,
                "access_points": [{"lat": 60.16564102824166, "lon": 24.949258097797674}],
            },
        )

        # And when subsequently PATCHing updated data with an additional entrance:
        r["workplace_entrances"].append({"lat": 60.16707918, "lon": 24.94728504, "deliveries": "no"})
        url = reverse("workplace-detail", kwargs={"pk": r["id"]})
        response = self.client.patch(url, json.dumps(r), content_type="application/json")

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)

        # And the response contains the additional entrance:
        r = response.json()
        entrances = r.get("workplace_entrances", [])
        self.assertEqual(len(entrances), 2)

        # And image notes have been created in the db for all created workplaces,
        # entrances and unloading places:
        notes = models.OSMImageNote.objects.all()
        self.assertEqual(
            [n.tags for n in notes], [["Workplace"], ["Entrance"], ["UnloadingPlace"], ["UnloadingPlace"], ["Entrance"]]
        )

    def test_workplace_api_example(self):
        url = reverse("workplace-list")
        data = example_workplace

        # When POSTing data for a new workplace, along with entrances, unloading places and access points:
        response = self.client.post(url, json.dumps(data), content_type="application/json")

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
