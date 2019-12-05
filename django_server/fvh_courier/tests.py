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
    def test_list_outgoing_packages_anonymous(self):
        # Given that no user is signed in
        # When requesting the list of outgoing packages
        url = reverse('outgoing_package-list')
        response = self.client.get(url)

        # Then an Forbidden response is received:
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_list_of_outgoing_packages(self):
        # Given that there are no packages registered for delivery
        # And that a user is signed in
        self.create_and_login_courier()

        # When requesting the list of outgoing packages
        url = reverse('outgoing_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains an empty list:
        self.assertEqual(response.data, [])

    def test_register_outgoing_package(self):
        # Given that there are no packages registered for delivery
        # And that a user is signed in
        sender = self.create_sender()
        self.client.force_login(sender)

        # When requesting to register a new package for delivery
        url = reverse('outgoing_package-list')
        now = timezone.now()
        fields = {
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
            "height": 20,
            "width": 30,
            "depth": 20,
            "weight": "2.00",
            "recipient": "Reginald Receiver",
            "recipient_phone": "+358401234567",
        }

        timestamps = {
            "earliest_pickup_time": now,
            "latest_pickup_time": now + datetime.timedelta(hours=1),

            "earliest_delivery_time": now + datetime.timedelta(hours=1),
            "latest_delivery_time": now + datetime.timedelta(hours=2)
        }
        response = self.client.post(url, dict(fields, **timestamps), format='json')

        # Then an OK response is received with the created package:
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assert_dict_contains(response.data, fields)

        # And when subsequently requesting the list of outgoing packages
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains the registered package:
        self.assertEqual(len(response.data), 1)
        assert_dict_contains(response.data[0], fields)

    def test_list_available_packages_anonymous(self):
        # Given that no user is signed in
        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an Forbidden response is received:
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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

    def test_reserved_package_not_available(self):
        # Given that a courier user is signed in
        courier = self.create_and_login_courier()

        # And that there are packages that have been reserved by a courier for delivery
        sender = self.create_sender()
        package = self.create_package(sender, courier=courier)

        # When requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it does not contain the reserved packages:
        self.assertEqual(len(response.data), 0)

    def test_reserve_package(self):
        # Given that a courier user is signed in
        courier = self.create_and_login_courier()

        # And given an available package for delivery
        sender = self.create_sender()
        package = self.create_package(sender)

        # When requesting to reserve the package
        url = reverse('available_package-reserve', kwargs={'pk': package.id})
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the package is linked to the logged in courier:
        package.refresh_from_db()
        self.assertEqual(package.courier_id, courier.id)

        # And when subsequently requesting the list of available packages
        url = reverse('available_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it does not contain the reserved packages:
        self.assertEqual(len(response.data), 0)

        # And when subsequently requesting the list of my packages
        url = reverse('my_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains the reserved packages:
        self.assertEqual(len(response.data), 1)

    def test_pick_up_package(self):
        # Given that a courier user is signed in
        courier = self.create_and_login_courier()

        # And given a package reserved for delivery
        sender = self.create_sender()
        package = self.create_package(sender, courier=courier)

        # When requesting to register that the package has been picked up
        url = reverse('my_package-register-pickup', kwargs={'pk': package.id})
        now = timezone.now()
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the package is marked as picked up:
        package.refresh_from_db()
        self.assertLessEqual(now, package.picked_up_time)

    def test_deliver_package(self):
        # Given that a courier user is signed in
        courier = self.create_and_login_courier()

        # And given a package reserved for delivery and picked up
        sender = self.create_sender()
        now = timezone.now()
        package = self.create_package(sender, courier=courier, picked_up_time=now)

        # When requesting to register that the package has been delivered
        url = reverse('my_package-register-delivery', kwargs={'pk': package.id})
        response = self.client.put(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And the package is marked as delivered:
        package.refresh_from_db()
        self.assertLessEqual(now, package.delivered_time)

    def test_view_openapi_schema(self):
        # When requesting to view the API schema
        url = reverse('openapi-schema')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def create_and_login_courier(self):
        user = User.objects.create(username='courier')
        user.groups.add(Group.objects.get(name=rest.COURIER_GROUP))
        self.client.force_login(user)
        return user

    def create_package(self, sender, **kwargs):
        now = timezone.now()
        return models.Package.objects.create(
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

            earliest_pickup_time=now,
            latest_pickup_time=now + datetime.timedelta(hours=1),

            earliest_delivery_time=now + datetime.timedelta(hours=1),
            latest_delivery_time=now + datetime.timedelta(hours=2),
            **kwargs
        )

    def create_sender(self):
        sender = User.objects.create(username='sender', first_name='Cedrik', last_name='Sender')
        sender.phone_numbers.create(number='+3587654321')
        return sender
