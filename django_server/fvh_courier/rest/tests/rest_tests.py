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
        courier = self.create_and_login_courier()

        # When requesting the current user over ReST
        url = reverse('rest_user_details')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assert_dict_contains(response.data, {
            'first_name': 'Coranne',
            'last_name': 'Courier',
            'username': 'courier',
            'phone_number': '+358505436657',
            'courier': {'id': courier.id},
            'courier_company': {
                'name': 'Couriers r us',
                'coordinator_id': courier.id,
                'couriers': [{
                    'id': courier.id, 'user_id': courier.user_id, 'first_name': 'Coranne', 'last_name': 'Courier',
                    'username': 'courier', 'phone_number': '+358505436657'
                }]
            }
        })

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
        courier.refresh_from_db()
        self.assertEqual(courier.lat, Decimal(location['lat']))
        self.assertEqual(courier.lon, Decimal(location['lon']))
        self.assertEqual(courier.user.username, 'courier')
