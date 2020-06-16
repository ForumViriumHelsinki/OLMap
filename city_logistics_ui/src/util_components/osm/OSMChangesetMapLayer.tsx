import React from 'react';
// @ts-ignore
import * as L from 'leaflet';
import {changeset, OSMFeature} from './types';
import Modal, {ModalBody} from "util_components/bootstrap/Modal";
import {osmFeatureLabel} from "util_components/osm/utils";
import {capitalize} from "utils";

const icons = {
  created: L.divIcon({className: "dotIcon smDot successDotIcon", iconSize: [8, 8]}),
  modified: L.divIcon({className: "dotIcon smDot processedDotIcon", iconSize: [8, 8]}),
  deleted: L.divIcon({className: "dotIcon smDot problemDotIcon", iconSize: [8, 8]}),
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
        {Object.entries(selectedNode.tags).map(([k, v]) =>
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
        // @ts-ignore
        const marker = L.marker({lon: node.lon, lat: node.lat}, {icon: icons[status]});
        marker.on('click', () => this.setState({selectedNode: node}));
        marker.addTo(mapLayer);
      });
    });
    return mapLayer;
  };
}
