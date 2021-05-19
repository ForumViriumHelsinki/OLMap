from django.urls import path
from rest_framework import routers

from .views import (
    NearbyAddressesView, WorkplaceEntrancesViewSet,
    OSMImageNotesViewSet, OSMImageNoteCommentsViewSet, OSMImageNotesGeoJSON,
    OSMEntrancesViewSet, OSMFeaturesViewSet, OSMImageNoteCommentNotificationsViewSet, WorkplaceTypeViewSet)


router = routers.DefaultRouter()
router.register('osm_image_notes', OSMImageNotesViewSet)
router.register('osm_image_note_comments', OSMImageNoteCommentsViewSet)
router.register('osm_entrances', OSMEntrancesViewSet, basename='osmentrance')
router.register('osm_features', OSMFeaturesViewSet)
router.register('notifications', OSMImageNoteCommentNotificationsViewSet)
router.register('workplace_types', WorkplaceTypeViewSet)
router.register('workplace_entrances', WorkplaceEntrancesViewSet)

urlpatterns = [
    path('addresses_at/<str:lon>/<str:lat>/', NearbyAddressesView.as_view(), name='nearby_addresses'),
    path('osm_image_notes.geojson', OSMImageNotesGeoJSON.as_view(), name='osm_image_notes_geojson')
] + router.urls
