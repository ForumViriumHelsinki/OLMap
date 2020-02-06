import React, {CSSProperties} from 'react';

// @ts-ignore
import * as L from 'leaflet';
// @ts-ignore
import _ from 'lodash';

import sessionRequest from "sessionRequest";
import {osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {AppContext, OSMImageNote} from "components/types";
import Modal from "util_components/Modal";
import ErrorAlert from "util_components/ErrorAlert";

import 'components/osm_image_notes/OSMImageNotes.css';
import OSMFeaturesSelection from "util_components/OSMFeaturesSelection";
import {LocationTuple} from "util_components/types";
import Component from "util_components/Component";
import OSMImageNoteReviewActions from "components/osm_image_notes/OSMImageNoteReviewActions";

const dotIcon = L.divIcon({className: "dotIcon", iconSize: [24, 24]});
const successDotIcon = L.divIcon({className: "dotIcon successDotIcon", iconSize: [24, 24]});

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
  static contextType = AppContext;
  static bindMethods = ['onFeaturesSelected', 'refresh'];

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
    const {user} = this.context;
    if (!selectedNote) return '';

    const location = [selectedNote.lon, selectedNote.lat] as LocationTuple;

    return (
      <Modal title={selectedNote.comment || 'No comment.'}
             className={selectedNote.image ? 'modal-xl' : 'modal-dialog-centered'}
             onClose={() => this.setState(initialState)}>
        {user.is_reviewer &&
          <OSMImageNoteReviewActions imageNote={selectedNote} onReviewed={this.refresh}/>
        }
        <ErrorAlert status={error} message="Saving features failed. Try again perhaps?"/>
        {selectedNote.image &&
          <img src={selectedNote.image} style={this.imageStyle} />
        }
        <div className="list-group-item"><strong>Related places:</strong></div>
        <div onClick={() => user.is_reviewer && readOnly && this.setState({readOnly: false})}>
          <OSMFeaturesSelection
            location={location} onSelect={this.onFeaturesSelected} readOnly={readOnly}
            maxHeight={null}
            preselectedFeatureIds={selectedNote.osm_features}/>
        </div>
      </Modal>
    )
  }

  private refresh() {
    this.setState(initialState);
    this.loadImageNotes();
  }

  onFeaturesSelected(featureIds: number[]) {
    const {selectedNote} = this.state;
    if (!selectedNote) return;
    const url = osmImageNoteUrl(selectedNote.id as number);

    sessionRequest(url, {method: 'PATCH', data: {osm_features: featureIds}})
    .then((response) => {
      if (response.status < 300) {
        selectedNote.osm_features = featureIds;
        this.setState({error: false, readOnly: true});
      } else this.setState({error: true});
    })
  }

  private getMapLayer() {
    const {user} = this.context;

    if (!this.mapLayer) this.mapLayer = L.layerGroup();
    this.osmImageNotes.forEach((osmImageNote) => {
      const id = String(osmImageNote.id);
      const icon = (user.is_reviewer && osmImageNote.is_reviewed) ? successDotIcon : dotIcon;
      if (this.dotMarkers[id]) return this.dotMarkers[id].setIcon(icon);
      const marker = L.marker({lon: osmImageNote.lon, lat: osmImageNote.lat}, {icon: icon})
      marker.on('click', () => this.setState({selectedNote: osmImageNote, readOnly: true}));
      marker.addTo(this.mapLayer);
      this.dotMarkers[id] = marker;
    });

    const index = _.keyBy(this.osmImageNotes, 'id');
    Object.entries(this.dotMarkers).filter(([id]) => !index[id]).forEach(([id, marker]) => {
      marker.remove();
      delete this.dotMarkers[id];
    });
    return this.mapLayer;
  }
}
