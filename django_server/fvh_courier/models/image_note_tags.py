from django.db import models

from .osm_image_notes import OSMImageNote


def dimension_field():
    return models.DecimalField(max_digits=3, decimal_places=1, help_text='In meters', blank=True, null=True)


def choices_field(choices, **kwargs):
    return models.CharField(blank=True, max_length=16, choices=[[c, c] for c in choices], **kwargs)


class ImageNoteProperties(models.Model):
    image_note = models.ForeignKey(OSMImageNote, on_delete=models.CASCADE)

    class Meta:
        abstract = True


class BaseAddress(ImageNoteProperties):
    street = models.CharField(max_length=64, blank=True)
    housenumber = models.PositiveSmallIntegerField(null=True, blank=True)
    unit = models.CharField(max_length=8, blank=True)

    class Meta:
        abstract = True


class Lockable(object):
    accesses = ['yes', 'private', 'delivery', 'no']
    access = choices_field(accesses)
    width = dimension_field()
    height = dimension_field()
    buzzer = models.BooleanField(default=False)
    keycode = models.BooleanField(default=False)
    phone = models.CharField(blank=True, max_length=32)
    opening_hours = models.CharField(blank=True, max_length=64)


class Entrance(Lockable, BaseAddress):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:entrance'

    types = ['main', 'secondary', 'service', 'staircase']
    type = choices_field(types)
    wheelchair = models.BooleanField(default=False)
    loadingdock = models.BooleanField(default=False)


class Steps(ImageNoteProperties):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Tag:highway%3Dsteps'

    step_count = models.PositiveSmallIntegerField(null=True, blank=True)
    handrail = models.BooleanField(null=True, blank=True)
    ramp = models.BooleanField(null=True, blank=True)
    width = dimension_field()
    incline = choices_field(['up', 'down'], help_text="From street level")


class Gate(Lockable, ImageNoteProperties):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Tag:barrier%3Dgate'

    lift_gate = models.BooleanField(default=False)


class Barrier(ImageNoteProperties):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:barrier'

    types = ['fence', 'wall', 'block', 'bollard']
    type = choices_field(types)


class Company(BaseAddress):
    name = models.CharField(blank=True, max_length=64)
    phone = models.CharField(blank=True, max_length=32)
    opening_hours = models.CharField(blank=True, max_length=64)
    level = models.CharField(blank=True, max_length=8, help_text="Floor(s), e.g. 1-3")

    class Meta:
        abstract = True


class Office(Company):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:office'
    types = ['association', 'company', 'diplomatic', 'educational_institution', 'government']
    type = choices_field(types)


class Shop(Company):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:shop'
    type = models.CharField(blank=True, max_length=32, help_text=f'See {osm_url}')


class Amenity(Company):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:amenity'
    type = models.CharField(max_length=32, help_text=f'See {osm_url}')
