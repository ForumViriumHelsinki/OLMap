from io import BytesIO

from PIL import Image as Img, UnidentifiedImageError, ExifTags
from django.contrib.auth.models import User
from django.core.files import File
from django.db import models

from .base import BaseLocation


class OSMFeature(models.Model):
    id = models.BigIntegerField(primary_key=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'OSMFeature({self.id})'


def upload_osm_images_to(instance, filename):
    return f'osm_image_notes/{instance.id}/{filename}'


class OSMImageNote(BaseLocation):
    image = models.ImageField(null=True, blank=True, upload_to=upload_osm_images_to)
    comment = models.TextField(blank=True)
    osm_features = models.ManyToManyField(OSMFeature, blank=True)

    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_notes')
    modified_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='modified_notes')
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_notes')

    visible = models.BooleanField(default=True)
    hidden_reason = models.TextField(
        blank=True, help_text="If reviewer decides to hide the note, document reason here.")

    def __str__(self):
        return self.comment or f'OSMImageNote({self.id})'

    def save(self, *args, **kwargs):
        if not self.image:
            return super().save(*args, **kwargs)

        try:
            pilImage = Img.open(BytesIO(self.image.read()))
        except (UnidentifiedImageError, FileNotFoundError):
            return super().save(*args, **kwargs)

        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break

        exif = pilImage._getexif()  # noqa
        if not exif:
            return super().save(*args, **kwargs)

        exif = dict(exif.items())
        orientation = exif.get(orientation, None)
        if not orientation:
            return super().save(*args, **kwargs)

        if orientation == 3:
            pilImage = pilImage.rotate(180, expand=True)
        elif orientation == 6:
            pilImage = pilImage.rotate(270, expand=True)
        elif orientation == 8:
            pilImage = pilImage.rotate(90, expand=True)

        output = BytesIO()
        pilImage.save(output, format='JPEG', quality=75)
        output.seek(0)
        self.image = File(output, self.image.name)

        return super().save(*args, **kwargs)

    def is_reviewed(self):
        return bool(self.reviewed_by_id)


class ImageNoteTag(models.Model):
    tag = models.CharField(max_length=64)
    image_note = models.ForeignKey(OSMImageNote, related_name='tags', on_delete=models.CASCADE)

    def __str__(self):
        return self.tag or (self.id and f'ImageNoteTag({self.id})') or 'New ImageNoteTag'
