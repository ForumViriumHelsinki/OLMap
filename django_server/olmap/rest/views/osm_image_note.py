from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema

from drf_jsonschema import to_jsonschema
from olmap import models
from olmap.rest.permissions import IsReviewerOrCreator, IsReviewer, user_is_reviewer
from olmap.rest.schema import SchemaWithParameters
from olmap.rest.serializers import DictOSMImageNoteSerializer, OSMImageNoteWithMapFeaturesSerializer, \
    OSMImageNoteCommentSerializer, OSMImageNoteCommentNotificationSerializer


class OSMImageNotesViewSet(viewsets.ModelViewSet):
    """
    Returns OLMap image notes, i.e. map data points with associated images and map features such as entrances,
    workplaces, steps, gates etc. Note that the list representation is limited, request an individual note by ID
    to get a full representation.
    """
    schema = SchemaWithParameters(tags=["Image notes"], tags_by_action={'list': ['Quick start'], 'retrieve': ['Quick start']})
    permission_classes = [permissions.AllowAny]
    serializer_class = OSMImageNoteWithMapFeaturesSerializer
    queryset = models.OSMImageNote.objects.filter(visible=True)

    # Use simple serializer for list to improve performance:
    serializer_classes = {
        'list': DictOSMImageNoteSerializer
    }

    def get_queryset(self):
        instructions_count = Count('workplace', filter=~Q(workplace__delivery_instructions=''))
        queryset = super().get_queryset().annotate(delivery_instructions=instructions_count)
        if self.action == 'list':
            # Fetch list as dicts rather than object instances for a bit more speed:
            return queryset.values()
        return queryset

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'hide_note']:
            return [IsReviewerOrCreator()]
        elif self.action in ['upvote', 'downvote', 'mark_processed']:
            return [permissions.IsAuthenticated()]
        elif self.action == ['mark_accepted', 'mark_reviewed']:
            return [IsReviewer()]
        else:
            return super().get_permissions()

    def get_serializer_class(self):
        return self.serializer_classes.get(self.action, self.serializer_class)

    def create(self, request, *args, **kwargs):
        self.ensure_features(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.ensure_features(request)
        return super().update(request, *args, **kwargs)

    def ensure_features(self, request):
        for id in request.data.get('osm_features', []):
            models.OSMFeature.objects.get_or_create(id=id)

    def perform_create(self, serializer):
        osm_image_note = serializer.save()
        if not self.request.user.is_anonymous:
            osm_image_note.created_by = self.request.user
            osm_image_note.modified_by = self.request.user
        osm_image_note.save()

    def perform_update(self, serializer):
        osm_image_note = serializer.save()
        if not self.request.user.is_anonymous:
            osm_image_note.modified_by = self.request.user
        osm_image_note.save()

    @action(methods=['PUT'], detail=True)
    def mark_reviewed(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.processed_by = osm_image_note.processed_by or request.user
        osm_image_note.accepted_by = osm_image_note.accepted_by or request.user
        osm_image_note.reviewed_by = request.user
        osm_image_note.save()
        return Response('OK')

    @action(methods=['PUT'], detail=True)
    def mark_accepted(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.accepted_by = request.user
        osm_image_note.save()
        return Response('OK')

    @action(methods=['PUT'], detail=True)
    def mark_processed(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.processed_by = request.user
        osm_image_note.accepted_by = osm_image_note.accepted_by or request.user
        osm_image_note.save()
        return Response('OK')

    @action(methods=['PUT'], detail=True)
    def hide_note(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.reviewed_by = request.user
        osm_image_note.visible = False
        osm_image_note.hidden_reason = request.data.get('hidden_reason', '')
        osm_image_note.save()
        return Response('OK')

    @action(methods=['PUT'], detail=True)
    def upvote(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.upvotes.get_or_create(user=request.user)
        osm_image_note.downvotes.filter(user=request.user).delete()
        osm_image_note = self.get_object() # Reload from db
        serializer = self.get_serializer(osm_image_note)
        return Response(serializer.data)

    @action(methods=['PUT'], detail=True)
    def downvote(self, request, *args, **kwargs):
        osm_image_note = self.get_object()
        osm_image_note.downvotes.get_or_create(user=request.user)
        osm_image_note.upvotes.filter(user=request.user).delete()
        osm_image_note = self.get_object() # Reload from db
        serializer = self.get_serializer(osm_image_note)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def map_feature_schemas(self, request, pk=None):
        serializer = self.get_serializer()
        schemas = {}
        for prop_type in models.map_feature_types:
            schema = to_jsonschema(serializer.fields[prop_type.__name__.lower() + '_set'].child)
            del schema['properties']['id']
            schemas[prop_type.__name__] = schema
        return Response(schemas)


class OSMImageNoteCommentsViewSet(viewsets.ModelViewSet):
    """
    Returns image note comments, i.e. comments made by authenticated or anonymous users to the map data points in
    OLMap. The response depends on the authenticated user:

     * If no user is authenticated, return an empty list. Comments can still be accessed by loading individual
       image notes through the image notes API, the comments are then included in the response.
     * If a normal user is authenticated, returns all comments made by that user and allows deleting individual
       comments with DELETE requests
     * If a reviewer user is authenticated, returns and allows deletion of all comments.
    """
    schema = AutoSchema(tags=["Image note comments"])
    queryset = models.OSMImageNoteComment.objects.all().select_related('user')
    permission_classes = [permissions.AllowAny]
    serializer_class = OSMImageNoteCommentSerializer

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return self.queryset.none()
        if user_is_reviewer(self.request.user):
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.is_anonymous:
            comment = serializer.save()
        else:
            comment = serializer.save(user=self.request.user)
        comment.notify_users()
        return comment


class OSMImageNoteCommentNotificationsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Returns any pending notifications of new comments on image notes, i.e. comments made on notes of interest to
    the authenticated user and not yet marked as seen. If no user is authenticated, return an empty list.
    """
    schema = AutoSchema(tags=["Image note comments"])
    queryset = models.OSMImageNoteCommentNotification.objects\
        .filter(seen__isnull=True)\
        .select_related('comment__user')\
        .order_by('-id')
    permission_classes = [permissions.AllowAny]
    serializer_class = OSMImageNoteCommentNotificationSerializer

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return self.queryset.none()
        return self.queryset.filter(user=self.request.user)

    @action(methods=['PUT'], detail=True)
    def mark_seen(self, request, *args, **kwargs):
        """
        Marks the notification as seen, i.e. removes it from the list of pending notifications for the authenticated
        user.
        """
        notification = self.get_object()
        if not notification.seen:
            notification.seen = timezone.now()
        notification.save()
        return Response('OK')


class OSMImageNotesGeoJSON(ListAPIView):
    """
    Returns OLMap image notes as geojson for easy inclusion in other services.
    Note that the response may be huge, load it only using tools efficient at handling big JSON responses.
    Loading in Swagger UI not recommended.
    """
    schema = AutoSchema(tags=["Image notes", "Quick_start"], operation_id_base='geojson_image_note')
    serializer_class = DictOSMImageNoteSerializer
    queryset = models.OSMImageNote.objects.filter(visible=True).values()
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer()
        return Response({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [note['lon'], note['lat']]
                },
                "properties": serializer.to_representation(note)
            } for note in self.get_queryset()]
        })
