import React from "react";

export type User = {
    id: number,
    is_reviewer: boolean,
    username: string,
    first_name: string,
    last_name: string,
    phone_number: string
};

type userId = number

export type OSMImageNoteComment = {
    created_at: string,
    comment: string,
    user: string,
    id: number,
    image_note: number
}

export type OSMImageNote = {
    id?: number,
    image?: any,
    lat?: number,
    lon?: number,
    comment?: string,
    osm_features: number[],
    addresses: number[],
    is_processed?: boolean,
    is_reviewed?: boolean,
    tags?: string[],
    created_at?: string,
    created_by?: number | {
        id: number,
        username: string
    },
    upvotes?: userId[],
    downvotes?: userId[],
    comments?: OSMImageNoteComment[]
};

export type Notification = {
    id: number,
    comment: OSMImageNoteComment
}

export type JSONSchema = any

export type MapFeatureTypes = {
  [featureType: string]: JSONSchema
};

export type MapFeature = {[field: string]: any}

export type AppContextType = {
    user?: User
}

export const AppContext = React.createContext({user: undefined} as AppContextType);

export type ImageNotesContextType = {
  osmImageNotes?: OSMImageNote[],
  mapFeatureTypes?: MapFeatureTypes,
  addNote: (note: OSMImageNote) => any,
  refreshNote: (note: OSMImageNote) => any,
  loadImageNotes: () => any,
  user?: User
}

export const ImageNotesContext = React.createContext({} as ImageNotesContextType);
