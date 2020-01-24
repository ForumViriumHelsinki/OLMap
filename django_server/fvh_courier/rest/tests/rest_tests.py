import os
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile, InMemoryUploadedFile
from django.urls import reverse
from rest_framework import status

from .base import FVHAPITestCase
from fvh_courier import models


class RestAPITests(FVHAPITestCase):
    def test_view_openapi_schema(self):
        # When requesting to view the API schema
        url = reverse('openapi-schema')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_current_user_when_not_signed_in(self):
        # Given that no user is signed in
        # When requesting the current user over ReST
        url = reverse('rest_user_details')
        response = self.client.get(url)

        # Then a 401 response is received:
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_when_signed_in(self):
        # Given that a courier user is signed in
        self.create_and_login_courier()

        # When requesting the current user over ReST
        url = reverse('rest_user_details')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assert_dict_contains(response.data, {'first_name': 'Coranne', 'last_name': 'Courier', 'is_courier': True})

    def test_save_user_location(self):
        # Given that a courier user is signed in
        courier = self.create_and_login_courier()

        # When requesting to save the current user location over ReST
        url = reverse('user_location')
        location = {'lat': '60.161687', 'lon': '24.944368'}
        response = self.client.put(url, data=location)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the user location is saved:
        self.assertEqual(courier.location.lat, Decimal(location['lat']))
        self.assertEqual(courier.location.lon, Decimal(location['lon']))

    def test_save_osm_image_note(self):
        # Given that a courier user is signed in
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
        url = reverse('osmimagenote-detail', kwargs={'pk': 1})
        response = self.client.patch(url, data={'image': uploaded_file}, format='multipart')

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And a note is updated in db:
        note = models.OSMImageNote.objects.get()
        self.assertEqual(note.image.name, 'osm_image_notes/1/image.png')
