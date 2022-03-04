export type Point = {
  lon?: number,
  lat?: number,
};

export type AccessPoint = Point;

export type MapFeature = Point & {
  id?: number,
  osm_feature?: string,
  image_note_id?: number,
  image?: string
};

export type UnloadingPlace = MapFeature & {
  access_points?: AccessPoint[]
};

export type WorkplaceEntrance = MapFeature & {
  entrance_id?: number,
  entrance_fields?: any,
  description?: string,
  deliveries?: 'yes' | 'no' | 'main' | '',
  unloading_places?: UnloadingPlace[]
}

export type Address = {
  street: string,
  housenumber: string,
  unit?: string
}

export type Workplace = MapFeature & Address & {
  name: string,
  delivery_instructions?: string,
  max_vehicle_height?: number,
  workplace_entrances?: WorkplaceEntrance[]
}
