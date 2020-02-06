import {Address, Location} from "util_components/types";
import React from "react";

export type User = {
    is_courier: boolean,
    is_reviewer: boolean,
    username: string,
    first_name: string,
    last_name: string,
    phone_numbers: string[]
};

export type Package = {
    created_at: string,
    recipient: string,
    recipient_phone: string,
    sender: User,
    courier?: User,
    courier_location?: Location,
    picked_up_time?: string,
    delivered_time?: string,

    earliest_pickup_time: string,
    latest_pickup_time: string,

    earliest_delivery_time: string,
    latest_delivery_time: string,

    pickup_at: Address,
    deliver_to: Address,
    weight: number,
    width: number,
    height: number,
    depth: number,
    id: number
}

export type packageAction = 'pickup' | 'delivery';

export type OSMImageNote = {
    id?: number,
    image?: any,
    lat?: number,
    lon?: number,
    comment?: string,
    osm_features: number[],
    is_reviewed?: boolean
};

export type AppContextType = {
    user?: User
}

export const AppContext = React.createContext({user: undefined} as AppContextType);
