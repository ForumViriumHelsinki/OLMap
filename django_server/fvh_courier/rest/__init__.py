from django.urls import path
from rest_framework import routers

from .views import (
    AvailablePackagesViewSet, MyPackagesViewSet, OutgoingPackagesViewSet,
    PackagesByUUIDReadOnlyViewSet, MyLocationView, OSMImageNotesViewSet, OSMImageNotesGeoJSON)


router = routers.DefaultRouter()
router.register('available_packages', AvailablePackagesViewSet, 'available_package')
router.register('my_packages', MyPackagesViewSet, 'my_package')
router.register('outgoing_packages', OutgoingPackagesViewSet, 'outgoing_package')
router.register('packages', PackagesByUUIDReadOnlyViewSet, 'uuid_package')
router.register('osm_image_notes', OSMImageNotesViewSet)

urlpatterns = [
    path('my_location/', MyLocationView.as_view(), name='user_location'),
    path('osm_image_notes.geojson', OSMImageNotesGeoJSON.as_view(), name='osm_image_notes_geojson')
] + router.urls
