import datetime

from django.conf import settings
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.safestring import mark_safe

from olmap import models


@admin.register(models.Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["street", "housenumber", "lat", "lon"]
    search_fields = ["street"]


admin.site.unregister(User)


@admin.register(User)
class UserWithNotesAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ("last_login", "notes", "notes_12h")

    def get_queryset(self, request):
        _12_hours_ago = timezone.now() - datetime.timedelta(hours=12)
        return (
            super()
            .get_queryset(request)
            .annotate(notes=Count("created_notes"))
            .annotate(notes_12h=Count("created_notes", filter=Q(created_notes__created_at__gt=_12_hours_ago)))
        )

    def notes(self, user):
        return user.notes

    def notes_12h(self, user):
        return user.notes_12h


@admin.register(models.OSMImageNote)
class OSMImageNoteAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "image__",
        "lat",
        "lon",
        "created_at",
        "created_by",
        "modified_at",
        "modified_by",
        "reviewed_by",
        "visible",
        "osm",
    ]
    search_fields = ["comment"]
    raw_id_fields = ["osm_features", "addresses"]
    readonly_fields = ["image_", "osm", "osm_edit", "created_by", "modified_by", "processed_by", "reviewed_by"]
    list_filter = ["visible", "created_by", "reviewed_by"]
    date_hierarchy = "created_at"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("created_by", "modified_by", "reviewed_by")

    def osm_url(self, location):
        return (
            "https://www.openstreetmap.org/note/new?"
            + f"lat={location.lat}&lon={location.lon}#map=19/{location.lat}/{location.lon}"
        )

    def osm(self, location):
        return mark_safe(f'<a target="_osm" href="{self.osm_url(location)}">osm</a>')

    def image_(self, image_note):
        if not image_note.image:
            return "No image."
        return mark_safe(
            f'<img src="{settings.MEDIA_URL}{image_note.image}" style="max-width: calc(100vw-260px); max-height: 60vh"/>'
        )

    def image__(self, image_note):
        if not image_note.image:
            return "No image."
        return mark_safe(f'<a href="{settings.MEDIA_URL}{image_note.image}" target="_blank">image</a>')

    def osm_edit(self, location):
        url = f"https://www.openstreetmap.org/edit#map=23/{location.lat}/{location.lon}"
        return mark_safe(f'<a target="_osm_edit" href="{url}">edit</a>')


@admin.register(models.OSMImageNoteComment)
class OSMImageNoteCommentAdmin(admin.ModelAdmin):
    list_display = ["comment", "image_note", "user", "created_at"]
    search_fields = ["comment"]
    list_filter = ["user"]
    date_hierarchy = "created_at"


@admin.register(models.WorkplaceType)
class WorkplaceTypeAdmin(admin.ModelAdmin):
    list_display = ["label", "_parents", "synonyms", "image_notes"]
    search_fields = ["label", "synonyms", "parents__label", "parents__parents__label"]
    filter_horizontal = ["parents"]

    def _parents(self, wp_type):
        return ", ".join([p.label for p in wp_type.parents.all()])

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("parents").annotate(image_notes=Count("workplace"))

    def image_notes(self, wp_type):
        return wp_type.image_notes
