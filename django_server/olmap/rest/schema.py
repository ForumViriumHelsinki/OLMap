from rest_framework.schemas import get_schema_view
from rest_framework.schemas.openapi import SchemaGenerator, AutoSchema


tags = [
    {'name': 'Image notes',
     'description':
        """Data points on the map, optionally associated with a photograph
        and data on map features such as entrances, workplaces, gates, steps etc."""},

    {'name': 'Image note comments',
     'description': 'Discussion between users in the comments section of an image note.'},

    {'name': 'Workplaces',
     'description': 'Possible delivery destinations, along with delivery instructions.'},

    {'name': 'Workplace entrances',
     'description':
        """Objects connecting a particular workplace to a 
        particular entrance, optionally detailing the usage types for that entrance in the context of the 
        workplace."""},

    {'name': 'Addresses',
     'description': 'Official address points from public data sources (not OSM).'},

    {'name': 'OSM Features',
     'description':
        """Links between OLMap data points and OpenStreetMap features, identified by the feature ID in OSM)."""},

    {'name': 'Unloading places',
     'description':
        """Recommended places to leave the vehicle while delivering goods to particular entrances."""},

    {'name': 'Entrances',
     'description': 'Entrance locations, photographs and feature data (entrance type, access, unit etc.).'},

    {'name': 'Mappers',
     'description':
         'Users who have created new notes lately; intended to allow filtering by note creator in the OLMap UI.'},
]


class Generator(SchemaGenerator):
    def get_schema(self, request=None, public=False):
        s = super().get_schema(request, public)
        s['tags'] = tags
        return s


schema_view = get_schema_view(
    title="Open Logistics Map API",
    description="API for interacting with data in the Open Logistics Map application.",
    version="1.0.0", public=True, generator_class=Generator)


class SchemaWithParameters(AutoSchema):
    def get_operation(self, path, method):
        op = super().get_operation(path, method)
        action_method = getattr(self.view, self.view.action)
        params = getattr(action_method, 'parameters', [])
        op['parameters'] += params
        return op


def with_parameters(params):
    def decorator(f):
        f.parameters = [{'name': a, 'in': 'query', 'required': True, 'schema': {'type': 'string'}} for a in params]
        return f
    return decorator