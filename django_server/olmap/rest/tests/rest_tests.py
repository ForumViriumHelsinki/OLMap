import os
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile, InMemoryUploadedFile
from django.urls import reverse
from rest_framework import status

from .base import FVHAPITestCase
from olmap import models


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
        # Given that a user is signed in
        user = self.create_and_login_user()

        # When requesting the current user over ReST
        url = reverse('rest_user_details')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assert_dict_contains(response.data, {
            'first_name': 'Coranne',
            'last_name': 'Courier',
            'username': 'courier'
        })
