import datetime

from django.contrib.auth.models import User, Group
from django.utils import timezone
from rest_framework.test import APITestCase
from fvh_courier import rest, models


class FVHAPITestCase(APITestCase):
    def assert_dict_contains(self, superset, subset, path=''):
        for key, expected in subset.items():
            full_path = path + key
            received = superset.get(key, None)
            if isinstance(expected, dict) and isinstance(received, dict):
                self.assert_dict_contains(superset[key], expected, full_path + '.')
            else:
                assert received == expected, 'Value mismatch for key {}: {} != {}'.format(
                    full_path, expected, received
                )

    def create_and_login_courier(self):
        user = User.objects.create(username='courier', first_name='Coranne', last_name='Courier')
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
            recipient_phone='+358505436657',

            earliest_pickup_time=now,
            latest_pickup_time=now + datetime.timedelta(hours=1),

            earliest_delivery_time=now + datetime.timedelta(hours=1),
            latest_delivery_time=now + datetime.timedelta(hours=2),
            **kwargs
        )

    def create_sender(self):
        sender = User.objects.create(username='sender', first_name='Cedrik', last_name='Sender')
        sender.phone_numbers.create(number='+358505436657')
        return sender
