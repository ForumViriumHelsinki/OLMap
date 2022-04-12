from rest_framework import renderers
from rest_framework.schemas import get_schema_view
from rest_framework.schemas.openapi import SchemaGenerator, AutoSchema


api_description = """
API for interacting with data in the Open Logistics Map (OLMap) application.

OLMap has 2 central data types, collected in order to support delivery of goods to the right entrance and workplace,
and to share information on relevant limitations related to the delivery:

 * **Image notes**: Points on the map with an optional associated photograph of features of interest, plus tags 
   categorizing the point (e.g. Entrance, Gate, Workplace) and structured data on the features depicted
   (e.g. entrance type, wheelchair accessibility, opening hours etc.)
 * **Workplaces**: Possible delivery destinations, e.g. companies, governement offices, schools etc., along with
   delivery instructions and recommended entrances, unloading places and routes for deliveries to the destination.
   
Most API functions can be completed by anonymous users, but some require authentication and some additional privileges,
e.g. reviewer or administrator status. It is highly recommended to create a user account and use it to complete any
data creation or modifications, so that the originator of the information is known and later updates possible.

A QA instance of the API is available at <https://api.qa.olmap.org/rest/> and may be used for testing.

The public OLMap UI at <https://app.qa.olmap.org> uses this API; by following the API usage of the UI with e.g. 
browser developer tools one may obtain more examples as needed.

The source code powering the application & API is available at <https://github.com/ForumViriumHelsinki/OLMap>.
"""


tags = [
    {'name': 'Quick start',
     'description':
        """The most central API endpoints at a glance."""},

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


class PlainJSONRenderer(renderers.JSONOpenAPIRenderer):
    """
    Same as JSONOpenAPIRenderer, but presents itself as application/json to satisfy requests with
    Accept: application/json header.
    """
    media_type = 'application/json'
    format = 'json'


schema_view = get_schema_view(
    title="Open Logistics Map API",
    description=api_description,
    version="1.0.0", public=True, generator_class=Generator,
    renderer_classes=[
        PlainJSONRenderer, renderers.OpenAPIRenderer,
        renderers.JSONOpenAPIRenderer, renderers.BrowsableAPIRenderer])


class SchemaWithParameters(AutoSchema):
    def __init__(self, *args, **kwargs):
        self.tags_by_action = kwargs.pop('tags_by_action', {})
        return super().__init__(*args, **kwargs)

    def get_operation(self, path, method):
        op = super().get_operation(path, method)
        action_method = getattr(self.view, self.view.action)

        params = getattr(action_method, 'parameters', [])
        op['parameters'] += params

        return op

    def get_tags(self, path, method):
        tags = super().get_tags(path, method)
        action_tags = self.tags_by_action.get(self.view.action, [])
        return tags + action_tags

    def map_serializer(self, serializer):
        example = getattr(serializer, 'example', None)
        sup = super().map_serializer(serializer)
        if example:
            sup['example'] = example
        return sup


def with_parameters(params):
    def decorator(f):
        f.parameters = [{'name': a, 'in': 'query', 'required': True, 'schema': {'type': 'string'}} for a in params]
        return f
    return decorator


def with_example(example):
    def decorator(f):
        f.example = example
        return f
    return decorator
