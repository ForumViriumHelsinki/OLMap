import React from 'react';
// @ts-ignore
import * as L from 'leaflet';
import {OSMChangeset, OSMFeature} from './types';
import Modal, {ModalBody} from "util_components/bootstrap/Modal";
import {osmFeatureLabel} from "util_components/osm/utils";
import {capitalize} from "utils";

const markerColors = {
  deleted: '#ff0000',
  created: '#28a745',
  modified: '#007bff',
};

type OSMChangesetMapLayerProps = {
  changeset: OSMChangeset,
  onLayerReady: (layer: any) => any
}

type OSMChangesetMapLayerState = {
  selectedNode?: OSMFeature
}

const initialState: OSMChangesetMapLayerState = {};

export default class OSMChangesetMapLayer extends React.Component<OSMChangesetMapLayerProps, OSMChangesetMapLayerState> {
  state = initialState;

  componentDidMount() {
    this.getMapLayer();
  }

  componentDidUpdate(prevProps: OSMChangesetMapLayerProps) {
    if (prevProps.changeset != this.props.changeset)
      this.getMapLayer();
  }

  render() {
    const {selectedNode} = this.state;
    if (!selectedNode) return null;
    return <Modal onClose={() => this.setState({selectedNode: undefined})}
                  title={osmFeatureLabel(selectedNode) || 'OSM node'}>
      <ModalBody>
        {([['id', selectedNode.id]]).concat(Object.entries(selectedNode.tags)).map(([k, v]) =>
          <div key={k}>
            <span className="d-inline-block mr-2" style={{minWidth: 100}}><strong>{capitalize(k)}:</strong></span>{v}
          </div>
        )}
      </ModalBody>
    </Modal>;
  }

  getMapLayer() {
    const {changeset, onLayerReady} = this.props;
    if (!changeset) return;
    const mapLayer = L.featureGroup();
    ['created', 'modified', 'deleted'].forEach((status) => {
      // @ts-ignore
      changeset[status].forEach((node: OSMFeature) => {
        const style = {
          radius: 3,
          // @ts-ignore
          color: markerColors[status],
          opacity: 1,
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 1
        };
        const marker = L.circleMarker({lng: node.lon, lat: node.lat}, style);
        marker.on('click', () => this.setState({selectedNode: node}));
        marker.addTo(mapLayer);
      });
    });
    onLayerReady(mapLayer);
    return mapLayer;
  };
}
