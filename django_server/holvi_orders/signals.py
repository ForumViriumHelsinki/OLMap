import django

order_received = django.dispatch.Signal(providing_args=["order"])
