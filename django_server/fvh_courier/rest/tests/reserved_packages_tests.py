from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from .base import FVHAPITestCase


class ReservedPackagesTests(FVHAPITestCase):
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