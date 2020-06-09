import datetime

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.safestring import mark_safe
from django.conf import settings
from fvh_courier import models
from holvi_orders.models import HolviWebshop


class PackageSMSInline(admin.TabularInline):
    model = models.PackageSMS
    extra = 0


@admin.register(models.Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'delivered_time', 'pickup_at', 'deliver_to', 'sender', 'recipient', 'courier']
    list_select_related = ['sender__user', 'courier__user']
    search_fields = [
        'pickup_at__street_address', 'deliver_to__street_address',
        'sender__user__username', 'sender__user__first_name', 'sender__user__last_name',
        'recipient',
        'courier__user__username', 'courier__user__first_name', 'courier__user__last_name',
    ]
    date_hierarchy = 'created_at'
    inlines = [PackageSMSInline]


@admin.register(models.Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['street_address', 'lat', 'lon']
    search_fields = ['street_address']


@admin.register(models.PackageSMS)
class PackageSMSAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'package_id', 'message_type', 'recipient_number',
        'package_sender', 'package_recipient', 'courier']
    list_select_related = ['package__sender__user', 'package__courier__user']
    date_hierarchy = 'created_at'

    def package_sender(self, msg):
        return msg.package.sender.get_full_name()

    def courier(self, msg):
        return msg.package.courier.get_full_name()

    def package_recipient(self, msg):
        return msg.package.recipient


admin.site.unregister(User)


class SenderInline(admin.TabularInline):
    model = models.Sender
    extra = 0


class CourierInline(admin.TabularInline):
    model = models.Courier
    extra = 0


@admin.register(User)
class UserWithRolesAdmin(UserAdmin):
    inlines = UserAdmin.inlines + [SenderInline, CourierInline]
    list_display = UserAdmin.list_display + ('notes', 'notes_12h')

    def get_queryset(self, request):
        _12_hours_ago = timezone.now() - datetime.timedelta(hours=12)
        return super().get_queryset(request)\
            .annotate(notes=Count('created_notes'))\
            .annotate(notes_12h=Count('created_notes', filter=Q(created_notes__created_at__gt=_12_hours_ago)))

    def notes(self, user):
        return user.notes

    def notes_12h(self, user):
        return user.notes_12h


@admin.register(models.CourierCompany)
class CourierCompanyAdmin(admin.ModelAdmin):
    pass


@admin.register(models.OSMImageNote)
class OSMImageNoteAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'image__', 'lat', 'lon', 'created_at', 'created_by', 'modified_at', 'modified_by',
                    'reviewed_by', 'visible', 'osm']
    search_fields = ['comment']
    readonly_fields = ['image_', 'osm', 'osm_edit']
    filter_horizontal = ['osm_features']
    list_filter = ['visible', 'created_by', 'reviewed_by']
    date_hierarchy = 'created_at'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by', 'modified_by', 'reviewed_by')

    def osm_url(self, location):
        return (f'https://www.openstreetmap.org/note/new?' +
                f'lat={location.lat}&lon={location.lon}#map=19/{location.lat}/{location.lon}')

    def osm(self, location):
        return mark_safe(f'<a target="_osm" href="{self.osm_url(location)}">osm</a>')

    def image_(self, image_note):
        if not image_note.image:
            return 'No image.'
        return mark_safe(f'<img src="{settings.MEDIA_URL}{image_note.image}" style="max-width: calc(100vw-260px); max-height: 60vh"/>')

    def image__(self, image_note):
        if not image_note.image:
            return 'No image.'
        return mark_safe(f'<a href="{settings.MEDIA_URL}{image_note.image}" target="_blank">image</a>')

    def osm_edit(self, location):
        url = f'https://www.openstreetmap.org/edit#map=23/{location.lat}/{location.lon}'
        return mark_safe(f'<a target="_osm_edit" href="{url}">edit</a>')


@admin.register(models.OSMImageNoteComment)
class OSMImageNoteCommentAdmin(admin.ModelAdmin):
    list_display = ['comment', 'image_note', 'user', 'created_at']
    search_fields = ['comment']
    list_filter = ['user']
    date_hierarchy = 'created_at'


class IgnoredHolviProductInline(admin.TabularInline):
    model = models.IgnoredHolviProduct
    extra = 0


class RequiredHolviProductInline(admin.TabularInline):
    model = models.RequiredHolviProduct
    extra = 0


@admin.register(HolviWebshop)
class HolviWebshopAdmin(admin.ModelAdmin):
    inlines = [IgnoredHolviProductInline, RequiredHolviProductInline]
