from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class FVHAPITestCase(APITestCase):
    def assert_dict_contains(self, superset, subset, path=""):
        for key, expected in subset.items():
            full_path = path + key
            received = superset.get(key, None)
            if isinstance(expected, dict) and isinstance(received, dict):
                self.assert_dict_contains(superset[key], expected, full_path + ".")
            else:
                assert received == expected, f"Value mismatch for key {full_path}: {expected} != {received}"

    def create_user(self):
        return User.objects.create(
            username="courier", first_name="Coranne", last_name="Courier", email="coranne@couriersrus.com"
        )

    def create_and_login_user(self):
        user = self.create_user()
        self.client.force_login(user)
        return user
