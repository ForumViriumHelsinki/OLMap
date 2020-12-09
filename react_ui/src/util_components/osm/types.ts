// @ts-ignore
import _ from 'lodash';

export type OSMFeature = {
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

const osmAddressString = (tags: OSMTags) =>
  _.filter([tags['addr:street'], tags['addr:housenumber'], tags['addr:unit']]).join(' ');

// These are searched, in order, to present OSM features as strings:
export const osmFeatureTypes: OSMFeatureType[] = [
  {
    name: 'entrance',
    requiredTag: 'entrance',
    label: (tags) => {
      const {entrance} = tags;
      const address = osmAddressString(tags);
      return `${address && `${address} `} ${entrance == 'yes' ? '' : entrance} (entrance)`;
    }
  },
  {
    name: 'business',
    requiredTag: 'shop',
    label: (tags) => {
      const {name} = tags;
      const shop = tags.shop == 'yes' ? 'business' : tags.shop;
      const address = osmAddressString(tags);
      return `${name ? `${name} (${shop})` : shop}${address && `: ${address}`}`;
    }
  },
  {
    name: 'place',
    requiredTag: 'place',
    label: (tags) => {
      const {name, place} = tags;
      const address = osmAddressString(tags);
      return `${name ? `${name} (${place})` : place}${address && `: ${address}`}`;
    }
  },
  {
    name: 'address with unit',
    requiredTag: 'addr:unit',
    label: (tags) => {
      const {name} = tags;
      const address = osmAddressString(tags);
      return `${name ? `${name}: ` : ''}${address}`;
    }
  },
  {
    name: 'address',
    requiredTag: 'addr:housenumber',
    label: (tags) => {
      const {name, source} = tags;
      const address = osmAddressString(tags);
      return `${name ? `${name}: ` : ''}${address} (${source ? 'official' : 'OSM'})`;
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
    name: 'barrier',
    requiredTag: 'barrier',
    label: (tags) => `barrier: ${tags.barrier}`
  }
];

export type changeset = {
  id: string,
  created: OSMFeature[],
  modified: OSMFeature[],
  deleted: OSMFeature[]
}