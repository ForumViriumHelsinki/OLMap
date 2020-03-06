import React from 'react';
// @ts-ignore
import _ from 'lodash';

// @ts-ignore
import OverpassFrontend from 'overpass-frontend';
import {LocationTuple, OSMFeature} from "util_components/types";
import CenteredSpinner from "util_components/CenteredSpinner";
import {getBoundsOfDistance, getDistance} from "geolib";
import {GeolibGeoJSONPoint, GeolibInputCoordinates} from "geolib/es/types";
// @ts-ignore
import {Button, ListGroup, ListGroupItem} from "reactstrap";
import PillsSelection from "util_components/PillsSelection";
import Toggle from "util_components/Toggle";

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
      return `${name}${highway ? ` (${highway} road)` : ''}`;
    }
  },
  {
    name: 'barrier',
    requiredTag: 'barrier',
    label: (tags) => `barrier: ${tags.barrier}`
  }
];

type sortOption = 'relevance' | 'distance' | 'name';
const sortOptions: sortOption[] = ['relevance', 'distance', 'name'];

type filterOption = 'entrance' | 'place' | 'address' | 'street' | 'barrier';
const filterOptions: filterOption[] = ['entrance', 'place', 'address', 'street', 'barrier'];

const filters: {[key: string]: (f: OSMFeature) => boolean | null} = {
  'entrance': (f) => Boolean(f.tags.entrance),
  'place': (f) => Boolean(f.tags.name && (f.type != 'way')),
  'address': (f) => Boolean(f.tags['addr:housenumber'] && !f.tags.name),
  'street': (f) => Boolean(f.type == "way"),
  'barrier': (f) => Boolean(f.tags.barrier)
};

type OSMFSState = {
  nearbyOSMFeatures: OSMFeature[],
  featuresLoading: boolean,
  selectedFeatureIds: number[]
  sortBy: sortOption,
  selectedFilters: filterOption[]
}

const initialState: OSMFSState = {
  nearbyOSMFeatures: [],
  featuresLoading: false,
  selectedFeatureIds: [],
  sortBy: sortOptions[0],
  selectedFilters: []
};

type OSMFSProps = {
  location: LocationTuple,
  onSelect: (featureIds: number[]) => any,
  distance: number,
  preselectedFeatureIds: number[],
  readOnly: boolean,
  maxHeight: any,
  onFeaturesLoaded: (features: OSMFeature[]) => any
}

export default class OSMFeaturesSelection extends React.Component<OSMFSProps, OSMFSState> {
  state: OSMFSState = initialState;

  static defaultProps = {
    distance: 30,
    preselectedFeatureIds: [],
    readOnly: false,
    maxHeight: 'calc(100vh - 248px)',
    onFeaturesLoaded: () => null
  };

  render() {
    const {selectedFeatureIds, featuresLoading, sortBy, selectedFilters} = this.state;
    const selectedFeatures = this.selectedFeatures();
    const {onSelect, readOnly, maxHeight} = this.props;

    return <>
      <div style={maxHeight ? {maxHeight, overflowY: 'auto'} : {}}><ListGroup>

        {readOnly ?
          selectedFeatures.length ?
            selectedFeatures.map((osmFeature: any, i) =>
              <ListGroupItem key={i}>{this.label(osmFeature)}</ListGroupItem>
            )
            :
            <ListGroupItem>No places selected</ListGroupItem>
        :
          <>
            <ListGroupItem className="pt-1 pt-sm-2">
              <span className="d-inline-block mr-1">
                <Toggle off='Sort' on='Sort by: '>
                  <PillsSelection options={sortOptions} selected={[sortBy]} color="secondary"
                                  onClick={this.sortBy}/>
                </Toggle>
              </span>
              <span className="d-inline-block mt-2 mt-sm-0">
                <Toggle off='Filter' on='Filter: '>
                  <PillsSelection options={filterOptions} selected={selectedFilters} color="secondary"
                                  onClick={this.toggleFilter}/>
                </Toggle>
              </span>
            </ListGroupItem>
            {this.getNearbyOSMFeatures().map((osmFeature: any, i: number) =>
              <ListGroupItem key={i} active={selectedFeatureIds.includes(osmFeature.id)}
                             onClick={() => this.toggleRelatedFeature(osmFeature)}>
                {this.label(osmFeature)}
              </ListGroupItem>
            )}
          </>
        }

        {featuresLoading &&
          <ListGroupItem><CenteredSpinner/></ListGroupItem>
        }

      </ListGroup></div>

      {!readOnly &&
        <Button block color="primary"
                onClick={() => onSelect(selectedFeatureIds)} className="mt-2">
          Done
        </Button>
      }
    </>;
  }

  sortBy = (opt: string) => {
    const sortBy = opt as sortOption;
    this.setState({sortBy});
  };

  toggleFilter = (f: string) => {
    const selectedFilters = this.state.selectedFilters.slice();
    const filter = f as filterOption;
    if (selectedFilters.includes(filter)) selectedFilters.splice(selectedFilters.indexOf(filter), 1);
    else selectedFilters.push(filter);
    this.setState({selectedFilters});
  };

  selectedFeatures() {
    return this.state.nearbyOSMFeatures.filter(f => this.state.selectedFeatureIds.includes(f.id))
  }

  componentDidUpdate(prevProps: OSMFSProps) {
    if (String(prevProps.location) != String(this.props.location)) this.reloadFeatures();
    if (String(prevProps.preselectedFeatureIds) != String(this.props.preselectedFeatureIds))
      this.preselectFeatures();
  }

  private preselectFeatures() {
    this.setState({selectedFeatureIds: this.props.preselectedFeatureIds});
  }

  componentDidMount() {
    this.reloadFeatures();
    this.preselectFeatures();
  }

  private label(osmFeature: OSMFeature) {
    const {location} = this.props;
    const {tags} = osmFeature;
    let label = '';

    osmFeatureTypes.forEach((osmFeatureType) => {
      if (!label && tags[osmFeatureType.requiredTag]) label = osmFeatureType.label(tags);
    });

    if (osmFeature.type == 'node')
      label += ` (${getDistance(osmFeature, location as GeolibInputCoordinates)}m)`
    return label && (label[0].toUpperCase() + label.slice(1)).replace('_', ' ');
  }

  private addNearbyFeature(osmFeature: OSMFeature) {
    if (osmFeature.type == 'relation') return;

    const nearbyOSMFeatures = this.state.nearbyOSMFeatures.slice();

    if (osmFeature.type == 'way') {
      const duplicate = nearbyOSMFeatures.find(
        f => (f.type == 'way') && (f.tags.name == osmFeature.tags.name));
      if (duplicate) return;
    }
    nearbyOSMFeatures.push(osmFeature);
    this.setState({nearbyOSMFeatures});
  }

  reloadFeatures() {
    const {location, distance, onSelect, onFeaturesLoaded} = this.props;
    const bounds = getBoundsOfDistance(location as GeolibGeoJSONPoint, distance);
    const overpassBounds = {
      minlat: bounds[0].latitude, maxlat: bounds[1].latitude,
      minlon: bounds[0].longitude, maxlon: bounds[1].longitude};

    const query = osmFeatureTypes.map(({requiredTag}) => `node['${requiredTag}']`).join(';') + ';way[name]';
    const overpassFrontend = new OverpassFrontend('//overpass-api.de/api/interpreter');
    overpassFrontend.BBoxQuery(query, overpassBounds, {},
      (err: any, response: any) => {
        if (err) console.error(err);
        this.addNearbyFeature(response.data);
      },
      (err: any) => {
        if (!this.state.nearbyOSMFeatures.length) onSelect([]);
        else {
          this.setState({featuresLoading: false})
          onFeaturesLoaded(this.state.nearbyOSMFeatures);
        }
      }
    );

    this.setState({nearbyOSMFeatures: [], featuresLoading: true});
    this.preselectFeatures();
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

  private getNearbyOSMFeatures() {
    const {sortBy, selectedFilters, nearbyOSMFeatures} = this.state;
    const {location} = this.props;

    const sortFn = {
      'name': (f: OSMFeature) => this.label(f),
      'distance': (f: OSMFeature) => f.type == 'node' ? getDistance(f, location as GeolibInputCoordinates): 40,
      'relevance': (f: OSMFeature) => {
        for (const i in osmFeatureTypes)
          if (f.tags[osmFeatureTypes[i].requiredTag]) return i;
        return osmFeatureTypes.length;
      }
    }[sortBy];
    const features = selectedFilters.length ?
      nearbyOSMFeatures.filter(f => _.some(selectedFilters.map(filter => filters[filter](f))))
      : nearbyOSMFeatures;
    return _.sortBy(features, sortFn);
  }
}