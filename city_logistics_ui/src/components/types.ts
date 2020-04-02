import {Address, Location} from "util_components/types";
import React from "react";

export type User = {
    id: number,
    is_courier: boolean,
    is_reviewer: boolean,
    is_sender: boolean,
    username: string,
    first_name: string,
    last_name: string,
    phone_numbers: string[]
};

export type Package = {
    name: string,
    details: string,
    delivery_instructions: string,
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

type userId = number

export type OSMImageNoteComment = {
    created_at: string,
    comment: string,
    user: string,
    id: number
}

export type OSMImageNote = {
    id?: number,
    image?: any,
    lat?: number,
    lon?: number,
    comment?: string,
    osm_features: number[],
    is_reviewed?: boolean,
    tags?: string[],
    created_by?: number,
    upvotes?: userId[],
    downvotes?: userId[],
    comments?: OSMImageNoteComment[]
};

export type JSONSchema = any

export type OSMFeatureProps = {
  [featureType: string]: JSONSchema
};

export type AppContextType = {
    user?: User
}

export const AppContext = React.createContext({user: undefined} as AppContextType);
