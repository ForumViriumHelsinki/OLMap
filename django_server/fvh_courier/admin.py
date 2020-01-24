from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.utils.safestring import mark_safe

from fvh_courier.models import Package, Address, PhoneNumber, PackageSMS, OSMImageNote


class PackageSMSInline(admin.TabularInline):
    model = PackageSMS
    extra = 0


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
    inlines = [PackageSMSInline]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['street_address', 'lat', 'lon']
    search_fields = ['street_address']


@admin.register(PackageSMS)
class PackageSMSAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'package_id', 'message_type', 'recipient_number',
        'package_sender', 'package_recipient', 'courier']
    list_select_related = ['package__sender', 'package__courier']
    date_hierarchy = 'created_at'

    def package_sender(self, msg):
        return msg.package.sender.get_full_name()

    def courier(self, msg):
        return msg.package.courier.get_full_name()

    def package_recipient(self, msg):
        return msg.package.recipient


admin.site.unregister(User)


class PhoneNumberInline(admin.TabularInline):
    model = PhoneNumber
    extra = 0


@admin.register(User)
class TeleconnectedUserAdmin(UserAdmin):
    inlines = UserAdmin.inlines + [PhoneNumberInline]


@admin.register(OSMImageNote)
class OSMImageNoteAdmin(admin.ModelAdmin):
    list_display = ['comment', 'image', 'lat', 'lon', 'osm']
    search_fields = ['comment']

    def osm(self, location):
        return mark_safe(
            f'<a href="https://www.openstreetmap.org/note/new?' +
            f'lat={location.lat}&lon={location.lon}#map=19/{location.lat}/{location.lon}">osm</a>')
