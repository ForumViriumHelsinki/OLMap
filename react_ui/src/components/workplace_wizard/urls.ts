import {Point} from "components/workplace_wizard/types";

export const geocoderUrl = `//api.digitransit.fi/geocoding/v1/search`;
export const workplacesUrl = `/rest/workplaces/`;
export const workplaceUrl = (id: number) => `/rest/workplaces/${id}/`;
export const olmapWorkplaceByOSMUrl = (id: string) => `/rest/workplaces_by_osm/${id}/`;
export const nearbyEntrancesUrl = ({lat, lon}: Point) =>
  `/rest/entrances/near/?lat=${lat}&lon=${lon}`;
