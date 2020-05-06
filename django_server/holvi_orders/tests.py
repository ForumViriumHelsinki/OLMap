from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from holvi_orders.test_data import holvi_order_webhook_payload


class HolviOrderTests(APITestCase):
    def create_sender(self):
        sender = User.objects.create(username='sender', first_name='Cedrik', last_name='Sender')
        return sender

    def test_holvi_webhook_endpoint(self):
        # Given a valid Holvi webhook payload
        data = holvi_order_webhook_payload

        # And a token identifying a sender account
        sender = self.create_sender()
        webshop = sender.holvi_webshops.create()

        # When POSTing the payload to the holvi order endpoint
        url = reverse('holvi_order', kwargs={'token': webshop.token})
        response = self.client.post(url, data, format='json')

        # Then an OK response is received
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # And it contains the created order
        self.assertDictEqual(response.json(), {
            'code': 'd3fc28d9d5e8f2489bf69c196a57b08d',
            'purchases': [
                {'answers': [], 'product_name': 'Shipping fee'},
                {'answers': [
                    {'label': '* OHJEET KULJETTAJALLE: Kirjoita tänne tiedoksi: Jos on ovikoodia jne.',
                     'answer': 'Watch your steps'},
                    {'label': 'Toppings', 'answer': 'ketchup, pinapple'}],
                    'product_name': 'Tasty Pizza'}],
            'pool': 'ybD2Fp',
            'firstname': 'Mark',
            'lastname': 'Smith',
            'company': '',
            'email': 'mark@holvi.com',
            'city': 'Helsinki',
            'country': 'FI',
            'street': 'Porthaninkatu 13',
            'postcode': '00530',
            'language': 'en',
            'phone': '+35888445544',
            'paid': True,
            'create_time': '2020-03-27T12:57:45.442000Z',
            'paid_time': '2020-03-27T12:59:04.582000Z',
            'shop': webshop.id})

        # And when subsequently POSTing the same payload again
        response = self.client.post(url, data, format='json')

        # Then an OK response is received
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
