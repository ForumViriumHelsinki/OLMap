import React from 'react';
// @ts-ignore
import _ from 'lodash';

import {LocationTuple} from "util_components/types";
import CenteredSpinner from "util_components/bootstrap/CenteredSpinner";
// @ts-ignore
import {Button, ListGroup, ListGroupItem} from "reactstrap";
import OSMFeatureList from "util_components/osm/OSMFeatureList";
import {OSMFeature, osmFeatureTypes} from "util_components/osm/types";

import {overpassQuery} from "util_components/osm/utils";

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
  onSelect?: (featureIds: number[], extraFeatureIds?: number[]) => any,
  onChange?: (featureIds: number[], extraFeatureIds?: number[]) => any,
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
                onClick={this.onSelect} className="mt-2">
          Done
        </Button>
      }
    </>;
  }

  onSelect = () => {
    const {onSelect, extraFeatures} = this.props;
    const {selectedFeatureIds} = this.state;
    const extraIndex = Object.fromEntries(extraFeatures.map(f => [f.id, f]));

    if (onSelect) onSelect(selectedFeatureIds.filter(i => !extraIndex[i]),
                           selectedFeatureIds.filter(i => extraIndex[i]));
  };

  onChange = (selectedFeatureIds: number[]) => {
    const {onChange, extraFeatures} = this.props;
    const extraIndex = Object.fromEntries(extraFeatures.map(f => [f.id, f]));

    this.setState({selectedFeatureIds});
    if (onChange) onChange(selectedFeatureIds.filter(i => !extraIndex[i]),
                           selectedFeatureIds.filter(i => extraIndex[i]));
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

  reloadFeatures() {
    const {location, distance, onSelect, onFeaturesLoaded} = this.props;
    const query = '(node[name];way[name];relation[name][building];relation[name][tourism];node[entrance];node[barrier];)->.result;';
    // @ts-ignore
    overpassQuery(query, location, distance).then((features: OSMFeature[]) => {
      if (!_.isEqual(location, this.props.location)) return;
      const nearbyOSMFeatures: OSMFeature[] = [];
      const wayNames: string[] = [];
      features.forEach(f => {
        if (f.type == 'way') {
          const duplicate = wayNames.find(n => n == f.tags.name);
          if (duplicate) return;
          else wayNames.push(f.tags.name);
        }
        nearbyOSMFeatures.push(f);
      });
      if (!nearbyOSMFeatures.length && onSelect) onSelect([]);
      else {
        this.setState({nearbyOSMFeatures, featuresLoading: false});
        onFeaturesLoaded(nearbyOSMFeatures);
      }
    });
    this.setState({nearbyOSMFeatures: [], featuresLoading: true});
    this.preselectFeatures();
  }
}