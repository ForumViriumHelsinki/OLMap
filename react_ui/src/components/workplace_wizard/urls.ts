import { Point } from "components/workplace_wizard/types";

// Use proxy path to avoid CORS issues and handle API key injection
export const geocoderUrl = `/digitransit-api/geocoding/v1/search`;
export const workplacesUrl = `/rest/workplaces/`;
export const workplaceUrl = (id: number | string) => `/rest/workplaces/${id}/`;
export const workplaceSearchUrl = (search: string) =>
  `/rest/workplaces/search/?name=${search}`;
export const olmapWorkplaceByOSMUrl = (id: string) =>
  `/rest/workplaces_by_osm/${id}/`;
export const nearbyEntrancesUrl = ({ lat, lon }: Point) =>
  `/rest/entrances/near/?lat=${lat}&lon=${lon}`;
export const nearbyUnloadingPlacesUrl = ({ lat, lon }: Point) =>
  `/rest/unloading_places/near/?lat=${lat}&lon=${lon}`;
