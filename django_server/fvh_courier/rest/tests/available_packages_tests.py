from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status

from .base import FVHAPITestCase


class AvailablePackagesTests(FVHAPITestCase):
    def test_list_available_packages_anonymous(self):
        # Given that no user is signed in
        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an Unauthorized response is received:
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_available_packages_not_courier(self):
        # Given that a non-courier user is signed in
        user = User.objects.create()
        self.client.force_login(user)

        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an Forbidden response is received:
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_list_of_available_packages(self):
        # Given that there are no packages available for delivery
        # And that a courier user is signed in
        self.create_and_login_courier()

        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains an empty list:
        self.assertEqual(response.data, [])

    def test_list_of_available_packages(self):
        # Given that there are packages available for delivery
        sender = self.create_sender()
        self.create_package(sender)

        # And that a courier user is signed in
        self.create_and_login_courier()

        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains the deliverable packages:
        self.assertEqual(len(response.data), 1)
        self.assert_dict_contains(response.data[0], {
            "pickup_at": {
                "street_address": "Paradisäppelvägen 123",
                "postal_code": "00123",
                "city": "Ankeborg",
                "country": "Ankerige",
                "lat": "64.04000000",
                "lon": "80.65000000"
            },
            "deliver_to": {
                "street_address": "Helvetesapelsinvägen 666",
                "postal_code": "00321",
                "city": "Ankeborg",
                "country": "Ankerige",
                "lat": "64.54000000",
                "lon": "80.05000000"
            },
            "sender": {
                "first_name": "Cedrik",
                "last_name": "Sender",
                "phone_numbers": ["+358505436657"]
            },
            "courier": None,
            "height": 20,
            "width": 30,
            "depth": 20,
            "weight": "2.00",
            "recipient": "Reginald Receiver",
            "recipient_phone": "+358505436657",
            "picked_up_time": None,
            "delivered_time": None
        })