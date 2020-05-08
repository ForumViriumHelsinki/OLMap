from io import BytesIO

from PIL import Image as Img, UnidentifiedImageError, ExifTags
from django.contrib.auth.models import User
from django.core.files import File
from django.db import models

from . import base
from .base import BaseLocation, TimestampedModel


class OSMFeature(base.Model):
    id = models.BigIntegerField(primary_key=True)
    associated_entrances = models.ManyToManyField('OSMFeature', related_name='associated_features', blank=True)

    class Meta:
        ordering = ['id']


def upload_osm_images_to(instance, filename):
    return f'osm_image_notes/{instance.id}/{filename}'


class OSMImageNote(BaseLocation, TimestampedModel):
    image = models.ImageField(null=True, blank=True, upload_to=upload_osm_images_to)
    comment = models.TextField(blank=True)
    osm_features = models.ManyToManyField(OSMFeature, blank=True, related_name='image_notes')

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
        return self.comment or super().__str__()

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


class ImageNoteTag(base.Model):
    tag = models.CharField(max_length=64)
    image_note = models.ForeignKey(OSMImageNote, related_name='tags', on_delete=models.CASCADE)

    def __str__(self):
        return self.tag or super().__str__()


class ImageNoteUpvote(base.Model):
    user = models.ForeignKey(User, related_name='image_note_upvotes', on_delete=models.CASCADE)
    image_note = models.ForeignKey(OSMImageNote, related_name='upvotes', on_delete=models.CASCADE)


class ImageNoteDownvote(base.Model):
    user = models.ForeignKey(User, related_name='image_note_downvotes', on_delete=models.CASCADE)
    image_note = models.ForeignKey(OSMImageNote, related_name='downvotes', on_delete=models.CASCADE)


class OSMImageNoteComment(base.Model):
    user = models.ForeignKey(User, related_name='image_note_comments', on_delete=models.CASCADE)
    image_note = models.ForeignKey(OSMImageNote, related_name='comments', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    comment = models.TextField()

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return self.comment or super().__str__()
