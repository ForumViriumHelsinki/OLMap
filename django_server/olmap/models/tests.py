from django.test import TestCase

from olmap.models import Address


class ModelTests(TestCase):
    def test_building_address(self):
        addresses = [['Kulosaarentie 22B 3, 3rd floor', 'Kulosaarentie 22'],
                     ['Lääkärinkatu 8  L rappu', 'Lääkärinkatu 8']]

        for [full_address, building_address] in addresses:
            # Given an address including building number & entrance details
            a = Address(street_address=full_address)

            # When requesting the building address:
            b = a.building_address()

            # Then the entrance details are stripped:
            self.assertEqual(b, building_address)

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