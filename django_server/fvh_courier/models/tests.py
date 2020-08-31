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

    def test_sync_street_address(self):
        # Given an address including building number & entrance details
        a = Address(street_address='Kulosaarentie 22B 3, 3rd floor')

        # When syncing the street address:
        a.sync_street_address()

        # Then the street, housenumber and unit are extracted:
        self.assertEqual(a.street, 'Kulosaarentie')
        self.assertEqual(a.housenumber, '22')
        self.assertEqual(a.unit, 'B')

        # Given an address including building number & entrance details
        a = Address(street_address='Lapinlahdenkatu 16 Maria 01, Building 3')

        # When syncing the street address:
        a.sync_street_address()

        # Then the street, housenumber and unit are extracted:
        self.assertEqual(a.street, 'Lapinlahdenkatu')
        self.assertEqual(a.housenumber, '16')
        self.assertEqual(a.unit, '')

        # Given an address with street, housenumber & unit
        a = Address(street='Lapinlahdenkatu', housenumber='16', unit='B')

        # When syncing the street address:
        a.sync_street_address()

        # Then the street address field is populated:
        self.assertEqual(a.street_address, 'Lapinlahdenkatu 16 B')