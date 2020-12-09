import React from 'react';

// @ts-ignore
import OverpassFrontend from 'overpass-frontend';
import {LocationTuple} from "util_components/types";
import CenteredSpinner from "util_components/bootstrap/CenteredSpinner";
import {getBoundsOfDistance} from "geolib";
import {GeolibGeoJSONPoint} from "geolib/es/types";
// @ts-ignore
import {Button, ListGroup, ListGroupItem} from "reactstrap";
import OSMFeatureList from "util_components/osm/OSMFeatureList";
import {OSMFeature, osmFeatureTypes} from "util_components/osm/types";

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
  onSelect?: (featureIds: number[]) => any,
  onChange?: (featureIds: number[]) => any,
  distance: number,
  preselectedFeatureIds: number[],
  readOnly: boolean,
  maxHeight: any,
  onFeaturesLoaded: (features: OSMFeature[]) => any
  featureActions?: (feature: OSMFeature) => any
  extraFeatures: OSMFeature[]
}

export default class OSMFeaturesSelection extends React.Component<OSMFSProps, OSMFSState> {
  state: OSMFSState = initialState;

  static defaultProps = {
    distance: 30,
    preselectedFeatureIds: [],
    readOnly: false,
    maxHeight: 'calc(100vh - 248px)',
    onFeaturesLoaded: () => null,
    extraFeatures: []
  };

  render() {
    const {selectedFeatureIds, featuresLoading, nearbyOSMFeatures} = this.state;
    const {onSelect, readOnly, maxHeight, featureActions, location, extraFeatures} = this.props;

    return <>
      <div style={maxHeight ? {maxHeight, overflowY: 'auto'} : {}}>
        {featuresLoading ?
          <ListGroup><ListGroupItem><CenteredSpinner/></ListGroupItem></ListGroup>
        :
          <OSMFeatureList {...{featureActions, location, readOnly, selectedFeatureIds}}
                          onChange={this.onChange} OSMFeatures={nearbyOSMFeatures.concat(extraFeatures)} />
        }
      </div>

      {!readOnly && onSelect &&
        <Button block color="primary"
                onClick={() => onSelect(selectedFeatureIds)} className="mt-2">
          Done
        </Button>
      }
    </>;
  }

  onChange = (selectedFeatureIds: number[]) => {
    const {onChange} = this.props;
    this.setState({selectedFeatureIds});
    if (onChange) onChange(selectedFeatureIds);
  };

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
        if (!this.state.nearbyOSMFeatures.length && onSelect) onSelect([]);
        else {
          this.setState({featuresLoading: false})
          onFeaturesLoaded(this.state.nearbyOSMFeatures);
        }
      }
    );

    this.setState({nearbyOSMFeatures: [], featuresLoading: true});
    this.preselectFeatures();
  }
}