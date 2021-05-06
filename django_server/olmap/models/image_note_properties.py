from time import sleep

import overpy
from django.contrib.postgres.fields import ArrayField
from geopy.distance import distance
from overpy.exception import OverpassTooManyRequests
from shapely.geometry import Point
from shapely.strtree import STRtree

from django.db import models

from . import Address
from .base import Model
from .osm_image_notes import OSMImageNote
from olmap.utils import intersection_matches


def dimension_field():
    return models.DecimalField(max_digits=4, decimal_places=2, help_text='In meters', blank=True, null=True)


def choices_field(choices, **kwargs):
    return models.CharField(blank=True, max_length=32, choices=[[c, c] for c in choices], **kwargs)


def filter_dict(d):
    return dict([k, v] for (k, v) in d.items() if v)


def as_dict(obj, *keys):
    return dict([k, getattr(obj, k, None)] for k in keys)


def bool_to_osm(b):
    return {True: 'yes', False: 'no', None: None}[b]


class OSMFeatureIndex(object):
    def __init__(self, osm_features):
        if not len(osm_features):
            self.index = {}
        elif isinstance(osm_features[0], dict):
            self.index = dict([(feature['id'], feature) for feature in osm_features])
        else:
            self.index = dict([(feature.id, feature) for feature in osm_features])

    def is_linked(self, image_note):
        for node in image_note.osm_features.all():
            if self.index.get(node.id, None):
                return True
        return False


class ImageNoteProperties(models.Model):
    image_note = models.ForeignKey(OSMImageNote, on_delete=models.CASCADE)

    # Override in subclasses to enable automatic linking of OSM nodes:
    osm_node_query = None
    required_osm_matching_tags = []
    max_distance_to_osm_node = 5

    class Meta:
        abstract = True

    def as_osm_tags(self):
        return {}

    @classmethod
    def link_notes_to_osm_objects(cls):
        if not (cls.osm_node_query and len(cls.required_osm_matching_tags)):
            return
        api = overpy.Overpass()

        query = f"""
        [out:json][timeout:25];
        node[{cls.osm_node_query}](area:3600034914)->.nodes;
        .nodes out;
        """
        print(f'Fetching Helsinki {cls.__name__}s from OSM...')
        try:
            result = api.query(query)
        except OverpassTooManyRequests:
            sleep(30)
            result = api.query(query)
        print(f'{len(result.nodes)} {cls.__name__}s found.')

        points = []
        for node in result.nodes:
            p = Point(node.lat, node.lon)
            p.node = node
            points.append(p)
        tree = STRtree(points)

        node_index = OSMFeatureIndex(result.nodes)

        instances = cls.objects.filter(image_note__processed_by__isnull=False)\
            .prefetch_related('image_note__osm_features')
        print(f'Checking {len(instances)} OLMap {cls.__name__}s for unlinked matches...')
        linked_count = 0
        for instance in instances:
            if node_index.is_linked(instance.image_note):
                continue
            note_position = [instance.image_note.lat, instance.image_note.lon]
            nearest_osm = tree.nearest(Point(*note_position)).node
            dst = distance([nearest_osm.lat, nearest_osm.lon], note_position).meters
            tags = instance.as_osm_tags()
            if (dst < cls.max_distance_to_osm_node and intersection_matches(nearest_osm.tags, tags, *cls.required_osm_matching_tags)):
                added = instance.image_note.link_osm_id(nearest_osm.id)
                if added:
                    linked_count += 1
                    print(f'Linked OSM {cls.__name__} {nearest_osm.id} to note {instance.image_note_id}; distance {str(dst)[:4]}m.')
        print(f'All done; {linked_count} new links created.')


class InfoBoard(ImageNoteProperties):
    types = ['map', 'board']
    type = choices_field(types, default='board')

    def as_osm_tags(self):
        return {
            'tourism': 'information',
            'information': self.type or 'board'
        }


class BaseAddress(ImageNoteProperties):
    street = models.CharField(max_length=64, blank=True)
    housenumber = models.CharField(max_length=8, blank=True, null=True, help_text='E.g. 3-5')
    unit = models.CharField(max_length=8, blank=True)

    class Meta:
        abstract = True

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), **filter_dict({
            'addr:street': self.street,
            'addr:housenumber': self.housenumber,
            'addr:unit': self.unit
        }))

    @classmethod
    def link_notes_to_official_address(cls):
        addresses = Address.objects.filter(city='Helsinki').values()
        address_id_index = OSMFeatureIndex(addresses)
        address_index = dict([(a['street_address'], a) for a in addresses])

        instances = cls.objects.prefetch_related('image_note__osm_features')
        print(f'Checking {len(instances)} OLMap {cls.__name__}s for unlinked matches...')
        linked_count = 0
        for instance in instances:
            street_address = f'{instance.street} {instance.housenumber}'
            address = address_index.get(street_address, None)
            if (not address) or address_id_index.is_linked(instance.image_note):
                continue
            note_position = [instance.image_note.lat, instance.image_note.lon]
            dst = distance(note_position, [address['lat'], address['lon']]).meters
            if dst < 150:
                added = instance.image_note.link_osm_id(address['id'])
                if added:
                    linked_count += 1
                    print(f'Linked address {street_address} to note {instance.image_note_id}; distance {str(dst)[:4]}m.')
        print(f'All done; {linked_count} new links created.')


class Lockable(models.Model):
    accesses = ['yes', 'private', 'delivery', 'no']
    access = choices_field(accesses)
    width = dimension_field()
    height = dimension_field()
    buzzer = models.BooleanField(blank=True, null=True)
    keycode = models.BooleanField(blank=True, null=True)
    phone = models.CharField(blank=True, max_length=32)
    opening_hours = models.CharField(blank=True, max_length=64)

    class Meta:
        abstract = True

    def as_osm_tags(self):
        tags = hasattr(super(), 'as_osm_tags') and super().as_osm_tags() or {}
        return filter_dict(dict(
            tags,
            description=(self.buzzer and 'With buzzer') or (self.keycode and 'With keycode'),
            **as_dict(self, 'access', 'width', 'height', 'phone', 'opening_hours')
        ))


class Entrance(Lockable, BaseAddress):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:entrance'

    types = ['main', 'secondary', 'service', 'staircase', 'garage']
    type = choices_field(types)
    wheelchair = models.BooleanField(blank=True, null=True)
    loadingdock = models.BooleanField(default=False)

    # For automatic linking of OSM nodes to OLMap instances:
    osm_node_query = 'entrance'
    required_osm_matching_tags = ['addr:unit', 'addr:housenumber', 'addr:street', 'entrance']

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), **filter_dict({
            'entrance': self.type or 'yes',
            'door': 'loadingdock' if self.loadingdock else None,
            'wheelchair': bool_to_osm(self.wheelchair)
        }))


class Steps(ImageNoteProperties):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Tag:highway%3Dsteps'

    step_count = models.PositiveSmallIntegerField(null=True, blank=True)
    handrail = models.BooleanField(null=True, blank=True)
    ramp = models.BooleanField(null=True, blank=True)
    width = dimension_field()
    incline = choices_field(['up', 'down'], help_text="From street level")

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), **filter_dict(dict(
            highway='steps',
            step_count=self.step_count,
            handrail=bool_to_osm(self.handrail),
            ramp=bool_to_osm(self.ramp),
            width=self.width,
            incline=self.incline
        )))


class Gate(Lockable, ImageNoteProperties):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Tag:barrier%3Dgate'

    lift_gate = models.BooleanField(default=False)

    # For automatic linking of OSM nodes to OLMap instances:
    osm_node_query = 'barrier~"^(gate|lift_gate)$"'
    required_osm_matching_tags = ['barrier']

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), **filter_dict({
            'barrier': 'lift_gate' if self.lift_gate else 'gate'
        }))


class Barrier(ImageNoteProperties):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:barrier'

    types = ['fence', 'wall', 'block', 'bollard']
    type = choices_field(types)

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), **filter_dict({
            'barrier': self.type or 'yes'
        }))


class Company(BaseAddress):
    name = models.CharField(blank=True, max_length=64)
    phone = models.CharField(blank=True, max_length=32)
    opening_hours = models.CharField(blank=True, max_length=64)
    opening_hours_covid19 = models.CharField(blank=True, max_length=64)
    level = models.CharField(blank=True, max_length=8, help_text="Floor(s), e.g. 1-3")

    # For automatic linking of OSM nodes to OLMap instances:
    max_distance_to_osm_node = 20

    class Meta:
        abstract = True

    def as_osm_tags(self):
        return dict(
            super().as_osm_tags(),
            **filter_dict(as_dict(self, 'name', 'phone', 'opening_hours', 'level')),
            **filter_dict({'opening_hours:covid19': self.opening_hours_covid19}))


class Office(Company):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:office'
    types = ['association', 'company', 'diplomatic', 'educational_institution', 'government']
    type = choices_field(types)

    # For automatic linking of OSM nodes to OLMap instances:
    osm_node_query = 'office'
    required_osm_matching_tags = ['addr:unit', 'addr:housenumber', 'addr:street', 'office', 'name']

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), office=self.type or 'yes')


class Shop(Company):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:shop'
    type = models.CharField(blank=True, max_length=32, help_text=f'See {osm_url}')

    # For automatic linking of OSM nodes to OLMap instances:
    osm_node_query = 'shop'
    required_osm_matching_tags = ['addr:unit', 'addr:housenumber', 'addr:street', 'name', 'shop']

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), shop=self.type or 'yes')


class Amenity(Company):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:amenity'
    type = models.CharField(max_length=32, help_text=f'See {osm_url}')
    delivery_covid19 = models.CharField(blank=True, max_length=64)
    takeaway_covid19 = models.CharField(blank=True, max_length=64)

    # For automatic linking of OSM nodes to OLMap instances:
    osm_node_query = 'amenity'
    required_osm_matching_tags = ['addr:unit', 'addr:housenumber', 'addr:street', 'name', 'amenity']

    def as_osm_tags(self):
        return dict(
            super().as_osm_tags(),
            amenity=self.type or 'yes',
            **filter_dict({'delivery:covid19': self.delivery_covid19, 'takeaway:covid19': self.takeaway_covid19}))


class WorkplaceType(Model):
    label = models.CharField(max_length=64)
    parents = models.ManyToManyField('WorkplaceType', blank=True, related_name='children')
    synonyms = ArrayField(base_field=models.CharField(max_length=64), default=list)
    osm_tags = models.JSONField()

    def __str__(self):
        return self.label or super().__str__()


class Workplace(Company):
    type = models.ForeignKey(WorkplaceType, on_delete=models.CASCADE)

    # For automatic linking of OSM nodes to OLMap instances:
    osm_node_query = 'name'
    required_osm_matching_tags = ['addr:unit', 'addr:housenumber', 'addr:street', 'office', 'amenity', 'shop', 'name']

    def as_osm_tags(self):
        return dict(super().as_osm_tags(), **self.type.osm_tags)


class TrafficSign(ImageNoteProperties):
    osm_url = 'https://wiki.openstreetmap.org/wiki/Key:traffic_sign'
    types = {'Max height': 'FI:342',
             'Max weight': 'FI:344',
             'No stopping': 'FI:371',
             'No parking': 'FI:372',
             'Loading zone': 'FI:C43',
             'Parking': 'FI:521'}
    type = choices_field(types.keys())
    text_in_signs = ['Max height', 'Max weight']
    text_sign='FI:871'
    text = models.CharField(max_length=128, blank=True)

    def as_osm_tags(self):
        code = self.types[self.type]
        if self.type in self.text_in_signs:
            return {'traffic_sign': f'{code}[{self.text}]'}
        return filter_dict({
            'traffic_sign': f'{code}',
            'traffic_sign:2': f'{self.text_sign}[{self.text}]' if self.text else None})


image_note_property_types = [Entrance, Steps, Gate, Barrier, Workplace, InfoBoard, TrafficSign]
address_property_types = [Entrance, Workplace]


def manager_name(prop_type):
    return prop_type.__name__.lower() + '_set'


def prefetch_properties(image_note_qset):
    return image_note_qset.prefetch_related(*[manager_name(p) for p in image_note_property_types])


def link_notes_to_osm_objects():
    for cls in image_note_property_types:
        cls.link_notes_to_osm_objects()


def link_notes_to_official_address():
    for cls in address_property_types:
        cls.link_notes_to_official_address()
