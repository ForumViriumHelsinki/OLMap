import {LocationTuple} from "util_components/types";

export const loginUrl = '/rest-auth/login/';
export const registerUrl = '/rest-auth/registration/';
export const passwordResetUrl = '/rest-auth/password/reset/';
export const changePasswordUrl = '/rest-auth/password/reset/confirm/';

export const osmImageNotesUrl = "/rest/osm_image_notes/";
export const osmImageNoteUrl = (id: number) => `/rest/osm_image_notes/${id}/`;

export const processedOSMImageNoteUrl = (id: number) => `/rest/osm_image_notes/${id}/mark_processed/`;
export const acceptOSMImageNoteUrl = (id: number) => `/rest/osm_image_notes/${id}/mark_reviewed/`;
export const rejectOSMImageNoteUrl = (id: number) => `/rest/osm_image_notes/${id}/hide_note/`;

export const upvoteOSMImageNoteUrl = (id: number) => `/rest/osm_image_notes/${id}/upvote/`;
export const downvoteOSMImageNoteUrl = (id: number) => `/rest/osm_image_notes/${id}/downvote/`;
export const osmImageNoteCommentsUrl = `/rest/osm_image_note_comments/`;
export const notificationsUrl = `/rest/notifications/`;
export const notificationSeenUrl = (id: number) => `/rest/notifications/${id}/mark_seen/`;

export const osmFeaturePropertiesUrl = "/rest/osm_image_notes/property_schemas/";

export const osmEntranceUrl = (id: number) => `/rest/osm_entrances/${id}/`;

export const nearbyAddressesUrl = (location: LocationTuple) =>
  `/rest/addresses_at/${location[0]}/${location[1]}/`;

export const workplaceTypesUrl = "/rest/workplace_types/";
