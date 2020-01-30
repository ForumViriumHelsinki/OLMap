import React from 'react';
// @ts-ignore
import _ from 'lodash';

// @ts-ignore
import OverpassFrontend from 'overpass-frontend';
import {LocationTuple, OSMFeature} from "util_components/types";
import Spinner from "util_components/Spinner";
import {getBoundsOfDistance, getDistance} from "geolib";
import {GeolibGeoJSONPoint, GeolibInputCoordinates} from "geolib/es/types";
// @ts-ignore
import {Button, ListGroup, ListGroupItem} from "reactstrap";

const overpassFrontend = new OverpassFrontend('//overpass-api.de/api/interpreter')

type OSMTags = { [tag: string]: string };

type OSMFeatureType = {
  name: string,
  label: (tags: OSMTags) => string,
  requiredTag: string,
}

const osmAddressString = (tags: OSMTags) =>
  _.filter([tags['addr:street'], tags['addr:housenumber'], tags['addr:unit']]).join(' ');

// These are searched, in order, to present OSM features as strings:
const osmFeatureTypes: OSMFeatureType[] = [
  {
    name: 'entrance',
    requiredTag: 'entrance',
    label: (tags) => {
      const {entrance} = tags;
      const address = osmAddressString(tags);
      return `${entrance == 'yes' ? 'entrance' : entrance}${address && `: ${address}`}`;
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
      const {name} = tags;
      const address = osmAddressString(tags);
      return `${name ? `${name}: ` : ''}${address}`;
    }
  },
  {
    name: 'street or other named feature',
    requiredTag: 'name',
    label: (tags) => {
      const {highway, name} = tags;
      return `${highway ? `${highway} road: ` : ''}${name}`;
    }
  },
  {
    name: 'barrier',
    requiredTag: 'barrier',
    label: (tags) => `barrier: ${tags.barrier}`
  }
];

type OSMFSState = {
  nearbyOSMFeatures: OSMFeature[],
  featuresLoading: boolean,
  selectedFeatureIds: number[]
}

const initialState: OSMFSState = {
  nearbyOSMFeatures: [],
  featuresLoading: false,
  selectedFeatureIds: []
};

type OSMFSProps = {
  location: LocationTuple,
  onSelect: (featureIds: number[]) => any,
  distance: number
}

export default class OSMFeaturesSelection extends React.Component<OSMFSProps, OSMFSState> {
  state: OSMFSState = initialState;

  static defaultProps = {
    distance: 20
  };

  render() {
    const {
      nearbyOSMFeatures, selectedFeatureIds, featuresLoading
    } = this.state;

    const {onSelect, location} = this.props;

    return <>
      <div style={{maxHeight: 'calc(100vh - 248px)', overflowY: 'auto'}}><ListGroup>
        {nearbyOSMFeatures.map((osmFeature: any, i) =>
          // @ts-ignore
          <OSMFeatureItem key={i} osmFeature={osmFeature} location={location as LocationTuple}
                          active={selectedFeatureIds.includes(osmFeature.id)}
                          onClick={() => this.toggleRelatedFeature(osmFeature)} />)}
        {featuresLoading &&
          <ListGroupItem><Spinner/></ListGroupItem>
        }
      </ListGroup></div>
      <Button block color="primary"
              onClick={() => onSelect(selectedFeatureIds)} className="mt-2">
        Done
      </Button>
    </>;
  }

  componentDidUpdate(prevProps: OSMFSProps) {
   if (prevProps.location != this.props.location) this.reloadFeatures();
  }

  componentDidMount() {
   this.reloadFeatures();
  }

  private addNearbyFeature(osmFeature: OSMFeature) {
    if (osmFeature.type == 'relation') return;

    const nearbyOSMFeatures = this.state.nearbyOSMFeatures.slice();

    if (osmFeature.type == 'way') {
      const duplicate = nearbyOSMFeatures.find(
        f => (f.type == 'way') && (f.tags.name == osmFeature.tags.name));
      if (duplicate) return;
    }

    const order = (feature: OSMFeature) => {
      for (const i in osmFeatureTypes)
        if (feature.tags[osmFeatureTypes[i].requiredTag]) return i;
      return osmFeatureTypes.length;
    };

    insertFeature: {
      for (const i in nearbyOSMFeatures)
        if (order(osmFeature) < order(nearbyOSMFeatures[i])) {
          nearbyOSMFeatures.splice(Number(i), 0, osmFeature);
          break insertFeature;
        }
      nearbyOSMFeatures.push(osmFeature);
    }
    this.setState({nearbyOSMFeatures});
  }

  reloadFeatures() {
    const {location, distance, onSelect} = this.props;
    const bounds = getBoundsOfDistance(location as GeolibGeoJSONPoint, distance);
    const overpassBounds = {
      minlat: bounds[0].latitude, maxlat: bounds[1].latitude,
      minlon: bounds[0].longitude, maxlon: bounds[1].longitude};

    const query = osmFeatureTypes.map(({requiredTag}) => `node['${requiredTag}']`).join(';') + ';way[name]';
    overpassFrontend.BBoxQuery(query, overpassBounds, {},
      (err: any, response: any) => {
        if (err) console.error(err);
        this.addNearbyFeature(response.data);
      },
      (err: any) => {
        if (!this.state.nearbyOSMFeatures.length) onSelect([]);
        else this.setState({featuresLoading: false})
      }
    );

    this.setState({...initialState, featuresLoading: true});
  }

  private toggleRelatedFeature(osmFeature: OSMFeature) {
    const selectedFeatureIds = this.state.selectedFeatureIds.slice();
    const index = selectedFeatureIds.indexOf(osmFeature.id);
    if (index == -1)
      selectedFeatureIds.push(osmFeature.id)
    else
      selectedFeatureIds.splice(index, 1);
    this.setState({selectedFeatureIds})
  }
}

type OSMFeatureItemProps = {
  osmFeature: OSMFeature,
  location: LocationTuple,
  active: boolean,
  onClick: () => any
};

class OSMFeatureItem extends React.Component<OSMFeatureItemProps> {
  render() {
    const {active, onClick} = this.props;
    return <ListGroupItem active={active} onClick={onClick}>{this.label()}</ListGroupItem>;
  }

  private label() {
    const {osmFeature, location} = this.props;
    const {tags} = osmFeature;
    let label = '';

    osmFeatureTypes.forEach((osmFeatureType) => {
      if (!label && tags[osmFeatureType.requiredTag]) label = osmFeatureType.label(tags);
    });

    if (osmFeature.type == 'node')
      label += ` (${getDistance(osmFeature, location as GeolibInputCoordinates)}m)`
    return label && (label[0].toUpperCase() + label.slice(1)).replace('_', ' ');
  }
}
