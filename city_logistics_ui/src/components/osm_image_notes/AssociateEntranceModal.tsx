import React from 'react';

import Modal from "util_components/Modal";
import {OSMFeature} from "util_components/osm/types";
import OSMFeatureList from "util_components/osm/OSMFeatureList";
import {LocationTuple} from "util_components/types";
import sessionRequest from "sessionRequest";
import {osmEntranceUrl} from "urls";
import ErrorAlert from "util_components/ErrorAlert";

type AssociateEntranceProps = {
  entrance: OSMFeature,
  nearbyFeatures: OSMFeature[],
  onClose: () => any
}

type AssociateEntranceState = {
  selectedFeatureIds: number[],
  error: boolean
}

const initialState: AssociateEntranceState = {
  selectedFeatureIds: [],
  error: false
};

export default class AssociateEntranceModal extends React.Component<AssociateEntranceProps, AssociateEntranceState> {
  state = initialState;

  render() {
    const {onClose, entrance} = this.props;
    const {selectedFeatureIds, error} = this.state;
    const location = [entrance.lon, entrance.lat] as LocationTuple;

    return <Modal onClose={onClose} title="Select businesses to associate with this entrance:">
      <ErrorAlert message='Saving failed. Perhaps try reloading?' status={error}/>
      <OSMFeatureList OSMFeatures={this.getBusinesses()}
                      onChange={this.onChange}
                      location={location}
                      selectedFeatureIds={selectedFeatureIds}/>
      <button className="btn btn-primary btn-block mt-2" onClick={onClose}>Done</button>
    </Modal>;
  }

  componentDidMount() {
    sessionRequest(this.getUrl()).then(response => {
      if (response.status < 400)
        response.json().then(({associated_features}) =>
          this.setState({selectedFeatureIds: associated_features}))
    })
  }

  onChange = (selectedFeatureIds: number[]) => {
    this.setState({selectedFeatureIds});
    sessionRequest(this.getUrl(), {method: 'PATCH', data: {associated_features: selectedFeatureIds}})
    .then(response => {
      if (response.status >= 400) this.setState({error: true});
    })
  };

  private getUrl() {
    return osmEntranceUrl(this.props.entrance.id);
  }

  private getBusinesses() {
    const {nearbyFeatures} = this.props;
    return nearbyFeatures.filter(f => f.tags.name && (f.type == 'node'));
  }
}
