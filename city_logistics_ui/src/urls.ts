import {packageAction} from "components/types";

export const loginUrl = '/rest-auth/login/';

export const availablePackagesUrl = "/rest/available_packages/";
export const reservePackageUrl = (id: number) => `/rest/available_packages/${id}/reserve/`;

export const outgoingPackagesUrl = "/rest/outgoing_packages/";
export const myLocationUrl = "/rest/my_location/";

export const myPackagesUrl = "/rest/my_packages/";
export const myPackageActionUrl = (id: number, action: packageAction) => `/rest/my_packages/${id}/register_${action}/`;

export const uuidPackageUrl = (uuid: string) => `/rest/packages/${uuid}/`;

