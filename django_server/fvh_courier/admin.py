from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from fvh_courier.models import Package, Address, PhoneNumber


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


admin.site.unregister(User)


class PhoneNumberInline(admin.TabularInline):
    model = PhoneNumber
    extra = 0


@admin.register(User)
class TeleconnectedUserAdmin(UserAdmin):
    inlines = UserAdmin.inlines + [PhoneNumberInline]
