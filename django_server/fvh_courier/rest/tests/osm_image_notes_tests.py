import os
from decimal import Decimal

from django.contrib.auth.models import Group, User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from .base import FVHAPITestCase
from fvh_courier import models
from fvh_courier.rest.permissions import REVIEWER_GROUP


class OSMImageNotesTests(FVHAPITestCase):
    def create_and_login_reviewer(self):
        user = User.objects.create(username='reviewer', first_name='Regina', last_name='Reviewer')
        user.groups.add(Group.objects.get(name=REVIEWER_GROUP))
        self.client.force_login(user)
        return user

    def test_save_osm_image_note(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # When requesting to save an OSM image note over ReST
        url = reverse('osmimagenote-list')
        fields = {
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view',
            'osm_features': [3330783778, 3336789583, 3330783754]
        }
        response = self.client.post(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        note = models.OSMImageNote.objects.get()

        # And it registers the user as the creator of the note:
        self.assertEqual(note.created_by_id, courier.id)
        self.assertEqual(note.modified_by_id, courier.id)

        # And when subsequently requesting to attach an image to the note
        with open(os.path.join(os.path.dirname(__file__), 'test_image.png'), 'rb') as file:
            file_content = file.read()
        uploaded_file = SimpleUploadedFile("image.png", file_content, content_type="image/png")
        url = reverse('osmimagenote-detail', kwargs={'pk': note.id})
        response = self.client.patch(url, data={'image': uploaded_file}, format='multipart')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.image.name, f'osm_image_notes/{note.id}/image.png')

    def test_save_osm_image_note_with_no_features(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # When requesting to save an OSM image note over ReST, giving an empty list of features to which to link
        url = reverse('osmimagenote-list')
        fields = {
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view',
            'osm_features': []
        }
        response = self.client.post(url, data=fields, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a note is created in db:
        note = models.OSMImageNote.objects.get()

    def test_update_osm_image_note_features(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to update an OSM image note over ReST, giving a list of features to which to link
        url = reverse('osmimagenote-detail', kwargs={'pk': note.id})
        response = self.client.patch(url, data={'osm_features': [37812542837, 12735437812]}, format='json')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.osm_features.count(), 2)

    def test_review_features(self):
        # Given that a reviewer user is signed in
        user = self.create_and_login_reviewer()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to mark the OSM image note as reviewed over ReST
        url = reverse('osmimagenote-mark-reviewed', kwargs={'pk': note.id})
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.reviewed_by_id, user.id)

    def test_hide_features(self):
        # Given that a reviewer user is signed in
        user = self.create_and_login_reviewer()

        # And given a successfully created OSM image note
        note = models.OSMImageNote.objects.create(lat='60.16134701761975', lon='24.944593941327188')

        # When requesting to mark the OSM image note as hidden over ReST
        url = reverse('osmimagenote-hide-note', kwargs={'pk': note.id})
        response = self.client.put(url, data={'hidden_reason': 'Too ugly.'})

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.reviewed_by_id, user.id)
        self.assertEqual(note.hidden_reason, 'Too ugly.')

        # And the note is not shown in further requests to list OSM image notes
        url = reverse('osmimagenote-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_osm_image_notes_as_geojson(self):
        # Given that a user is signed in
        courier = self.create_and_login_courier()

        # And given that there are some OSM image notes in the db
        note = models.OSMImageNote.objects.create(**{
            'lat': '60.16134701761975',
            'lon': '24.944593941327188',
            'comment': 'Nice view'})
        for id in [3330783778, 3336789583, 3330783754]:
            note.osm_features.create(id=id)

        # When requesting the notes as geojson
        url = reverse('osm_image_notes_geojson')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains the notes as geojson:
        self.assertDictEqual(response.json(), {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [24.94459394, 60.16134702]},
                'properties': {
                    'id': note.id,
                    'comment': 'Nice view',
                    'image': None,
                    'lat': '60.16134702',
                    'lon': '24.94459394',
                    'osm_features': [3330783754, 3330783778, 3336789583],
                    'is_reviewed': False
                }
            }]
        })
