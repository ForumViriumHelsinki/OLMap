from django.test import TestCase

from fvh_courier.models import Address


class ModelTests(TestCase):
    def test_building_address(self):
        # Given an address including building number & entrance details
        a = Address(street_address='Kulosaarentie 22B 3, 3rd floor')

        # When requesting the building address:
        b = a.building_address()

        # Then the entrance details are stripped:
        self.assertEqual(b, 'Kulosaarentie 22')
