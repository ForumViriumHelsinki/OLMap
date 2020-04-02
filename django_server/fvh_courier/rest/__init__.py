from django.urls import path
from rest_framework import routers

from .views import (
    AvailablePackagesViewSet, MyPackagesViewSet, MyDeliveredPackagesViewSet,
    PendingOutgoingPackagesViewSet, DeliveredOutgoingPackagesViewSet,
    PackagesByUUIDReadOnlyViewSet, MyLocationView,
    OSMImageNotesViewSet, OSMImageNoteCommentsViewSet, OSMImageNotesGeoJSON,
    OSMEntrancesViewSet, OSMFeaturesViewSet)


router = routers.DefaultRouter()
router.register('available_packages', AvailablePackagesViewSet, 'available_package')
router.register('my_packages', MyPackagesViewSet, 'my_package')
router.register('my_delivered_packages', MyDeliveredPackagesViewSet, 'my_delivered_package')
router.register('pending_outgoing_packages', PendingOutgoingPackagesViewSet, 'pending_outgoing_package')
router.register('delivered_outgoing_packages', DeliveredOutgoingPackagesViewSet, 'delivered_outgoing_package')
router.register('packages', PackagesByUUIDReadOnlyViewSet, 'uuid_package')
router.register('osm_image_notes', OSMImageNotesViewSet)
router.register('osm_image_note_comments', OSMImageNoteCommentsViewSet)
router.register('osm_entrances', OSMEntrancesViewSet, basename='osmentrance')
router.register('osm_features', OSMFeaturesViewSet)

urlpatterns = [
    path('my_location/', MyLocationView.as_view(), name='user_location'),
    path('osm_image_notes.geojson', OSMImageNotesGeoJSON.as_view(), name='osm_image_notes_geojson')
] + router.urls
