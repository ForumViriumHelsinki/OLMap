from django.urls import path
from rest_framework import routers

from .views import (
    EntranceViewSet,
    FullOSMImageNotesGeoJSON,
    NearbyAddressesView,
    OSMFeaturesViewSet,
    OSMImageNoteCommentNotificationsViewSet,
    OSMImageNoteCommentsViewSet,
    OSMImageNotesGeoJSON,
    OSMImageNotesViewSet,
    RecentMappersViewSet,
    UnloadingPlacesViewSet,
    WorkplaceByOSMIdViewSet,
    WorkplaceEntrancesViewSet,
    WorkplaceTypeViewSet,
    WorkplaceViewSet,
    WorkplaceWithNoteViewSet,
)
from .views.search import SearchView

router = routers.DefaultRouter()
router.register("osm_image_notes", OSMImageNotesViewSet)
router.register("osm_image_note_comments", OSMImageNoteCommentsViewSet)
router.register("osm_features", OSMFeaturesViewSet)
router.register("notifications", OSMImageNoteCommentNotificationsViewSet)
router.register("workplace_types", WorkplaceTypeViewSet)
router.register("workplace_entrances", WorkplaceEntrancesViewSet)
router.register("unloading_places", UnloadingPlacesViewSet)
router.register("recent_mappers", RecentMappersViewSet)

router.register("workplaces", WorkplaceViewSet)
router.register("workplaces_with_note", WorkplaceWithNoteViewSet, "workplace_with_note")
router.register("workplaces_by_osm", WorkplaceByOSMIdViewSet)
router.register("entrances", EntranceViewSet)

urlpatterns = [
    path("search/", SearchView.as_view(), name="search"),
    path("addresses_at/<str:lon>/<str:lat>/", NearbyAddressesView.as_view(), name="nearby_addresses"),
    path("osm_image_notes.geojson", OSMImageNotesGeoJSON.as_view(), name="osm_image_notes_geojson"),
    path("osm_image_notes_full.geojson", FullOSMImageNotesGeoJSON.as_view(), name="full_osm_image_notes_geojson"),
    *router.urls,
]
