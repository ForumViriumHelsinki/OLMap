from django.contrib import admin

from fvh_courier.models import Package, Address


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'delivered_time', 'pickup_at', 'deliver_to', 'sender', 'recipient', 'courier']
    search_fields = [
        'pickup_at__street_address', 'deliver_to__street_address',
        'sender__username', 'sender__first_name', 'sender__last_name',
        'recipient',
        'courier__username', 'courier__first_name', 'courier__last_name',
    ]
    date_hierarchy = 'created_at'


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['street_address', 'lat', 'lon']
    search_fields = ['street_address']

# Register your models here.
