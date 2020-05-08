import datetime

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from holvi_orders.test_data import holvi_order_webhook_payload, holvi_delivery_order_webhook_payload
from .base import FVHAPITestCase
from fvh_courier import models


class OutgoingPackagesTests(FVHAPITestCase):
    def test_list_outgoing_packages_anonymous(self):
        # Given that no user is signed in
        # When requesting the list of outgoing packages
        url = reverse('pending_outgoing_package-list')
        response = self.client.get(url)

        # Then an Unauthorized response is received:
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_list_of_outgoing_packages(self):
        # Given that there are no packages registered for delivery
        # And that a user is signed in
        self.create_and_login_courier()

        # When requesting the list of outgoing packages
        url = reverse('pending_outgoing_package-list')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains an empty list:
        self.assertEqual(response.data, [])

    def test_get_new_package_schema(self):
        # Given that a user is signed in
        self.create_and_login_courier()

        # When requesting the schema for a new package over ReST
        url = reverse('pending_outgoing_package-jsonschema')
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assert_dict_contains(response.data, {
            'type': 'object',
            'properties': {
                'pickup_at': {
                    'type': 'object',
                    'required': ['street_address', 'postal_code', 'city', 'country'],
                    'title': 'Pickup at'
                },
                'deliver_to': {
                    'type': 'object',
                    'required': ['street_address', 'postal_code', 'city', 'country'],
                    'title': 'Deliver to'
                },
                'height': {
                    'type': ['integer', 'null'], 'title': 'Height', 'description': 'in cm'},
                'width': {
                    'type': ['integer', 'null'], 'title': 'Width', 'description': 'in cm'},
                'depth': {
                    'type': ['integer', 'null'], 'title': 'Depth', 'description': 'in cm'},
                'weight': {
                    'type': ['string', 'null'],
                    'pattern': '^\\-?[0-9]*(\\.[0-9]{1,2})?$',
                    'title': 'Weight',
                    'description': 'in kg'},
                'recipient': {
                    'type': 'string', 'maxLength': 128, 'minLength': 1, 'title': 'Recipient'},
                'recipient_phone': {
                    'type': 'string', 'maxLength': 32, 'minLength': 1, 'title': 'Recipient phone number'},
                'earliest_pickup_time': {
                    'type': 'string', 'format': 'date-time', 'title': 'Earliest pickup time'},
                'latest_pickup_time': {
                    'type': 'string', 'format': 'date-time', 'title': 'Latest pickup time'},
                'earliest_delivery_time': {
                    'type': 'string', 'format': 'date-time', 'title': 'Earliest delivery time'},
                'latest_delivery_time': {
                    'type': 'string', 'format': 'date-time', 'title': 'Latest delivery time'}
            },
            'required': [
                'pickup_at', 'deliver_to', 'recipient', 'recipient_phone',
                'earliest_pickup_time', 'latest_pickup_time', 'earliest_delivery_time', 'latest_delivery_time'
            ]
        })

        self.assert_dict_contains(response.data['properties']['pickup_at'], {
            'properties': {
                'street_address': {
                    'type': 'string',
                    'maxLength': 128,
                    'minLength': 1,
                    'title': 'Street address'},
                'postal_code': {
                    'type': 'string',
                    'maxLength': 16,
                    'minLength': 1,
                    'title': 'Postal code'},
                'city': {
                    'type': 'string',
                    'maxLength': 64,
                    'minLength': 1,
                    'title': 'City'},
                'country': {
                    'type': 'string',
                    'maxLength': 64,
                    'minLength': 1,
                    'title': 'Country'},
                'lat': {'type': ['string', 'null'], 'pattern': '^\\-?[0-9]*(\\.[0-9]{1,8})?$', 'title': 'Lat'},
                'lon': {'type': ['string', 'null'], 'pattern': '^\\-?[0-9]*(\\.[0-9]{1,8})?$', 'title': 'Lon'}
            }
        })

    def test_register_outgoing_package(self):
        # Given that there are no packages registered for delivery
        # And that a user is signed in
        courier = self.create_courier()
        sender = self.create_sender(courier_company=courier.company)
        self.client.force_login(sender.user)

        # When requesting to register a new package for delivery
        url = reverse('pending_outgoing_package-list')
        now = timezone.now()
        fields = {
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
            "height": 20,
            "width": 30,
            "depth": 20,
            "weight": "2.00",
            "recipient": "Reginald Receiver",
            "recipient_phone": "+358505436657",
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
        self.assert_dict_contains(response.data, fields)

        # And the package is allocated to the courier company preferred by the sender:
        self.assertEqual(models.Package.objects.get().courier_company_id, sender.courier_company_id)

        # And when subsequently requesting the list of outgoing packages
        response = self.client.get(url)

        # Then an OK response is received:
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # And it contains the registered package:
        self.assertEqual(len(response.data), 1)
        self.assert_dict_contains(response.data[0], fields)

    def test_pickup_holvi_order(self):
        # Given a valid Holvi webhook payload without home delivery ordered (i.e. a pickup order):
        data = holvi_order_webhook_payload

        # And a token identifying a sender account with a primary courier attached
        courier = self.create_courier()
        sender = self.create_sender(courier_company=courier.company)
        webshop = sender.user.holvi_webshops.create()

        # When POSTing the payload to the holvi order endpoint
        url = reverse('holvi_order', kwargs={'token': webshop.token})
        response = self.client.post(url, data, format='json')

        # Then an OK response is received
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And no new outgoing package is created
        self.client.force_login(sender.user)
        url = reverse('pending_outgoing_package-list')
        response = self.client.get(url)
        self.assertEqual(response.json(), [])

    def test_outgoing_package_from_holvi_order(self):
        # Given a valid Holvi webhook payload, including an order for home delivery:
        data = holvi_delivery_order_webhook_payload

        # And a token identifying a sender account with a primary courier attached
        courier = self.create_courier()
        sender = self.create_sender(courier_company=courier.company)
        webshop = sender.user.holvi_webshops.create()

        # When POSTing the payload to the holvi order endpoint
        url = reverse('holvi_order', kwargs={'token': webshop.token})
        response = self.client.post(url, data, format='json')

        # Then an OK response is received
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And a new outgoing package is created
        self.client.force_login(sender.user)
        url = reverse('pending_outgoing_package-list')
        response = self.client.get(url)

        self.assert_dict_contains(response.json()[0], {
            'pickup_at': {
                'street_address': 'Paradisäppelvägen 123',
                'postal_code': '00123',
                'city': 'Ankeborg',
                'country': 'Ankerige'},
            'deliver_to': {
                'street_address': 'Porthaninkatu 13',
                'postal_code': '00530',
                'city': 'Helsinki',
                'country': 'FI'},
            'sender': {
                'first_name': 'Cedrik',
                'last_name': 'Sender'},
            'recipient': 'Mark Smith',
            'recipient_phone': '+35888445544',
            'delivery_instructions': 'Watch your steps'})

        # And the primary courier is informed by SMS
        models.PackageSMS.objects.get(message_type=models.PackageSMS.types_by_name['courier_notification'])
