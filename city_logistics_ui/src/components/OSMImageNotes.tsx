import React, {CSSProperties} from 'react';
import sessionRequest from "sessionRequest";
import {osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {OSMImageNote} from "components/types";
import Modal from "util_components/Modal";
import ErrorAlert from "util_components/ErrorAlert";

// @ts-ignore
import * as L from 'leaflet';

import './OSMImageNotes.css';
import OSMFeaturesSelection from "util_components/OSMFeaturesSelection";
import {LocationTuple} from "util_components/types";
import Component from "util_components/Component";

const dotIcon = L.divIcon({className: "dotIcon", iconSize: [16, 16]});

type OSMImageNotesProps = {
  onMapLayerLoaded: (mapLayer: any) => any
}

type OSMImageNotesState = {
  selectedNote?: OSMImageNote,
  readOnly: boolean,
  error: boolean
}

const initialState: OSMImageNotesState = {
  readOnly: true,
  error: false,
  selectedNote: undefined
};

export default class OSMImageNotes extends Component<OSMImageNotesProps, OSMImageNotesState> {
  static bindMethods = ['onFeaturesSelected'];

  private osmImageNotes: OSMImageNote[] = [];
  private mapLayer?: any;
  private dotMarkers: {[id: string]: any} = {};

  state: OSMImageNotesState = initialState;

  imageStyle: CSSProperties = {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 200px)',
    objectFit: 'contain',
    margin: '0 auto',
    display: 'block'};

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
    const {selectedNote, readOnly, error} = this.state;
    if (!selectedNote) return '';

    const location = [selectedNote.lon, selectedNote.lat] as LocationTuple;

    return (
      <Modal title={selectedNote.comment || 'No comment.'}
             className={selectedNote.image ? 'modal-xl' : 'modal-dialog-centered'}
             onClose={() => this.setState(initialState)}>
        <ErrorAlert status={error} message="Saving features failed. Try again perhaps?"/>
        {selectedNote.image &&
          <img src={selectedNote.image} style={this.imageStyle} />
        }
        <div className="list-group-item"><strong>Related places:</strong></div>
        <div onClick={() => readOnly && this.setState({readOnly: false})}>
          <OSMFeaturesSelection location={location} onSelect={this.onFeaturesSelected} readOnly={readOnly}
                                preselectedFeatureIds={selectedNote.osm_features}/>
        </div>
      </Modal>
    )
  }

  onFeaturesSelected(featureIds: number[]) {
    const {selectedNote} = this.state;
    if (!selectedNote) return;
    const url = osmImageNoteUrl(selectedNote.id as number);
    sessionRequest(url, {method: 'PATCH', data: {osm_features: featureIds}})
    .then((response) => {
      if (response.status < 300) {
        selectedNote.osm_features = featureIds;
        this.setState(initialState);
      } else this.setState({error: true});
    })
  }

  private getMapLayer() {
    if (!this.mapLayer) this.mapLayer = L.layerGroup();
    this.osmImageNotes.forEach((osmImageNote) => {
      const id = String(osmImageNote.id);
      if (this.dotMarkers[id]) return;
      const marker = L.marker({lon: osmImageNote.lon, lat: osmImageNote.lat}, {icon: dotIcon})
      marker.on('click', () => this.setState({selectedNote: osmImageNote, readOnly: true}));
      marker.addTo(this.mapLayer);
      this.dotMarkers[id] = marker;
    });
    return this.mapLayer;
  }
}
