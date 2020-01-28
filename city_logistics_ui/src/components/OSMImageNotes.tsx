import React from 'react';
import sessionRequest from "sessionRequest";
import {osmImageNotesUrl} from "urls";
import {OSMImageNote} from "components/types";
import Modal from "util_components/Modal";
// @ts-ignore
import * as L from 'leaflet';

import './OSMImageNotes.css';

const dotIcon = L.divIcon({className: "dotIcon", iconSize: [16, 16]});

type OSMImageNotesProps = {
  onMapLayerLoaded: (mapLayer: any) => any
}

type OSMImageNotesState = {
  selectedNote?: OSMImageNote
}

export default class OSMImageNotes extends React.Component<OSMImageNotesProps, OSMImageNotesState> {
  private osmImageNotes: OSMImageNote[] = [];
  private mapLayer?: any;
  private dotMarkers: {[id: string]: any} = {};

  state: OSMImageNotesState = {};

  componentDidMount() {
    this.loadImageNotes();
  }

  loadImageNotes() {
    sessionRequest(osmImageNotesUrl).then((response: any) => {
      if (response.status < 300)
        response.json().then((osmImageNotes: OSMImageNote[]) => {
          this.osmImageNotes = osmImageNotes;
          this.props.onMapLayerLoaded(this.getMapLayer())
        });
    })
  }

  render() {
    const {selectedNote} = this.state;
    return selectedNote ?
      <Modal title={selectedNote.comment || 'No comment.'} onClose={() => this.setState({selectedNote: undefined})}>
        {selectedNote.image &&
          <img src={selectedNote.image} style={{maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain'}} />
        }
      </Modal>
      : ''
  }

  private getMapLayer() {
    if (!this.mapLayer) this.mapLayer = L.layerGroup();
    this.osmImageNotes.forEach((osmImageNote) => {
      const id = String(osmImageNote.id);
      if (this.dotMarkers[id]) return;
      const marker = L.marker({lon: osmImageNote.lon, lat: osmImageNote.lat}, {icon: dotIcon})
      marker.on('click', () => this.setState({selectedNote: osmImageNote}));
      marker.addTo(this.mapLayer);
      this.dotMarkers[id] = marker;
    })
    return this.mapLayer;
  }
}
