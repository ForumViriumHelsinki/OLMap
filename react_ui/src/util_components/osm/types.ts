// @ts-ignore
import _ from 'lodash';

export type OSMFeature = {
  geometry?: any[];
  nodes?: number[];
  type: "node" | "way" | "relation",
  id: number,
  lat: number,
  lon: number,
  tags: { [tag: string]: string }
}

type OSMTags = { [tag: string]: string };

type OSMFeatureType = {
  name: string,
  label: (tags: OSMTags) => string,
  requiredTag: string,
}

export const osmAddressString = (tags: OSMTags) =>
  _.filter([tags['addr:street'], tags['addr:housenumber'], tags['addr:unit']]).join(' ');

// These are searched, in order, to present OSM features as strings:
export const osmFeatureTypes: OSMFeatureType[] = [
  {
    name: 'entrance',
    requiredTag: 'entrance',
    label: (tags) => {
      const {entrance} = tags;
      const address = osmAddressString(tags);
      return `${address && `${address} `} ${entrance == 'yes' ? '' : entrance} entrance`;
    }
  },
  {
    name: 'street or other named feature',
    requiredTag: 'name',
    label: (tags) => {
      const {highway, name} = tags;
      return `${name}${highway ? ` (${highway} road)` : ''}`;
    }
  },
  {
    name: 'address',
    requiredTag: 'addr:housenumber',
    label: (tags) => {
      const {name} = tags;
      const address = osmAddressString(tags);
      return name ? `${name}: ${address}` : address;
    }
  },
  {
    name: 'barrier',
    requiredTag: 'barrier',
    label: (tags) => `barrier: ${tags.barrier}`
  }
];

export type OSMChangeset = {
  id: string,
  created: OSMFeature[],
  modified: OSMFeature[],
  deleted: OSMFeature[]
}