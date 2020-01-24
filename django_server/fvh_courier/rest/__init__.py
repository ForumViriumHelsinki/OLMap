from django.urls import path
from rest_framework import routers

from .views import (
    AvailablePackagesViewSet, MyPackagesViewSet, OutgoingPackagesViewSet,
    PackagesByUUIDReadOnlyViewSet, MyLocationView, OSMImageNotesViewSet)


router = routers.DefaultRouter()
router.register('available_packages', AvailablePackagesViewSet, 'available_package')
router.register('my_packages', MyPackagesViewSet, 'my_package')
router.register('outgoing_packages', OutgoingPackagesViewSet, 'outgoing_package')
router.register('packages', PackagesByUUIDReadOnlyViewSet, 'uuid_package')
router.register('osm_image_notes', OSMImageNotesViewSet)

urlpatterns = router.urls + [
    path('my_location/', MyLocationView.as_view(), name='user_location')
]
