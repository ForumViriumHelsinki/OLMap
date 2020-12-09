import React from 'react';
// @ts-ignore
import * as L from 'leaflet';
import {changeset, OSMFeature} from './types';
import Modal, {ModalBody} from "util_components/bootstrap/Modal";
import {osmFeatureLabel} from "util_components/osm/utils";
import {capitalize} from "utils";

const markerColors = {
  deleted: '#ff0000',
  created: '#28a745',
  modified: '#007bff',
};

type OSMChangesetMapLayerProps = {}

type OSMChangesetMapLayerState = {
  selectedNode?: OSMFeature
}

const initialState: OSMChangesetMapLayerState = {};

export default class OSMChangesetMapLayer extends React.Component<OSMChangesetMapLayerProps, OSMChangesetMapLayerState> {
  state = initialState;

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

  getMapLayer(changeset?: changeset) {
    if (!changeset) return;
    const mapLayer = L.layerGroup();
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
        const marker = L.circleMarker({lon: node.lon, lat: node.lat}, style);
        marker.on('click', () => this.setState({selectedNode: node}));
        marker.addTo(mapLayer);
      });
    });
    return mapLayer;
  };
}
