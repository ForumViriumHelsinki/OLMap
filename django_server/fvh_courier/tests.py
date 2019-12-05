import datetime

from django.contrib.auth.models import User, Group
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from . import rest, models


def assert_dict_contains(superset, subset, path=''):
    for key, expected in subset.items():
        full_path = path + key
        received = superset.get(key, None)
        if isinstance(expected, dict) and isinstance(received, dict):
            assert_dict_contains(superset[key], expected, full_path + '.')
        else:
            assert received == expected, 'Value mismatch for key {}: {} != {}'.format(
                full_path, expected, received
            )


# noinspection DuplicatedCode
class RestAPITests(APITestCase):
    def test_list_available_packages_anonymous(self):
        # Given that no user is signed in
        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an Unauthorized response is received:
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_available_packages_not_courier(self):
        # Given that a non-courier user is signed in
        user = User.objects.create()
        self.client.force_login(user)

        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an Unauthorized response is received:
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_list_of_available_packages(self):
        # Given that there are no packages available for delivery
        # And that a courier user is signed in
        user = User.objects.create()
        user.groups.add(Group.objects.get(name=rest.COURIER_GROUP))
        self.client.force_login(user)

        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains an empty list:
        self.assertEqual(response.data, [])

    def test_list_of_available_packages(self):
        # Given that there are packages available for delivery
        now = timezone.now()

        sender = User.objects.create(username='sender', first_name='Cedrik', last_name='Sender')
        sender.phone_numbers.create(number='+3587654321')

        models.Package.objects.create(
            pickup_at=models.Address.objects.create(
                street_address='Paradisäppelvägen 123',
                postal_code='00123',
                city='Ankeborg',
                country='Ankerige',
                lat=64.04,
                lon=80.65
            ),
            deliver_to=models.Address.objects.create(
                street_address='Helvetesapelsinvägen 666',
                postal_code='00321',
                city='Ankeborg',
                country='Ankerige',
                lat=64.54,
                lon=80.05
            ),

            height=20, width=30, depth=20, weight=2,

            sender=sender,
            recipient='Reginald Receiver',
            recipient_phone='+358401234567',

            courier=None,

            earliest_pickup_time=now,
            latest_pickup_time=now + datetime.timedelta(hours=1),

            earliest_delivery_time=now + datetime.timedelta(hours=1),
            latest_delivery_time=now + datetime.timedelta(hours=2)
        )

        # And that a courier user is signed in
        user = User.objects.create()
        user.groups.add(Group.objects.get(name=rest.COURIER_GROUP))
        self.client.force_login(user)

        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains the deliverable packages:
        self.assertEqual(len(response.data), 1)
        assert_dict_contains(response.data[0], {
            "pickup_at": {
                "street_address": "Paradisäppelvägen 123",
                "postal_code": "00123",
                "city": "Ankeborg",
                "country": "Ankerige",
                "lat": "64.040000",
                "lon": "80.650000"
            },
            "deliver_to": {
                "street_address": "Helvetesapelsinvägen 666",
                "postal_code": "00321",
                "city": "Ankeborg",
                "country": "Ankerige",
                "lat": "64.540000",
                "lon": "80.050000"
            },
            "sender": {
                "first_name": "Cedrik",
                "last_name": "Sender",
                "phone_numbers": ["+3587654321"]
            },
            "courier": None,
            "height": 20,
            "width": 30,
            "depth": 20,
            "weight": "2.00",
            "recipient": "Reginald Receiver",
            "recipient_phone": "+358401234567",
            "picked_up_time": None,
            "delivered_time": None
        })
