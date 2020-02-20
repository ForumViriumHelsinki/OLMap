from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.utils.safestring import mark_safe
from django.conf import settings
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
    list_display = ['__str__', 'image', 'lat', 'lon', 'created_at', 'created_by', 'modified_at', 'modified_by',
                    'reviewed_by', 'visible', 'osm']
    search_fields = ['comment']
    readonly_fields = ['image_', 'osm', 'osm_edit']
    filter_horizontal = ['osm_features']
    list_filter = ['visible', 'created_by', 'reviewed_by']
    date_hierarchy = 'created_at'

    def osm_url(self, location):
        return (f'https://www.openstreetmap.org/note/new?' +
                f'lat={location.lat}&lon={location.lon}#map=19/{location.lat}/{location.lon}')

    def osm(self, location):
        return mark_safe(f'<a target="_osm" href="{self.osm_url(location)}">osm</a>')

    def image_(self, image_note):
        if not image_note.image:
            return 'No image.'
        return mark_safe(f'<img src="{settings.MEDIA_URL}{image_note.image}" style="max-width: calc(100vw-260px); max-height: 60vh"/>')

    def osm_edit(self, location):
        url = f'https://www.openstreetmap.org/edit#map=23/{location.lat}/{location.lon}'
        return mark_safe(f'<a target="_osm_edit" href="{url}">edit</a>')
