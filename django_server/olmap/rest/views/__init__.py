from .address import NearbyAddressesView
from .map_features import WorkplaceTypeViewSet, WorkplaceEntrancesViewSet, UnloadingPlacesViewSet, \
    WorkplaceViewSet, WorkplaceByOSMIdViewSet, EntranceViewSet, WorkplaceWithNoteViewSet
from .osm_features import OSMFeaturesViewSet
from .osm_image_note import OSMImageNotesViewSet, OSMImageNoteCommentsViewSet, \
    OSMImageNoteCommentNotificationsViewSet, OSMImageNotesGeoJSON, FullOSMImageNotesGeoJSON
from .recent_mappers import RecentMappersViewSet
