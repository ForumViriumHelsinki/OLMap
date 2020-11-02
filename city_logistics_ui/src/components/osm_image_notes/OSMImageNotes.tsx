import React from 'react';
// @ts-ignore
import {HashRouter as Router, Route, Switch, withRouter} from "react-router-dom";

// @ts-ignore
import * as L from 'leaflet';
// @ts-ignore
import _ from 'lodash';

import sessionRequest from "sessionRequest";
import {osmFeaturePropertiesUrl, osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {OSMFeatureProps, OSMImageNote} from "components/types";

import 'components/osm_image_notes/OSMImageNotes.css';

import OSMImageNoteModal from "components/osm_image_notes/OSMImageNoteModal";

const markerColors = {
  problem: '#ff0000',
  reviewed: '#28a745',
  processed: '#007bff',
  new: '#ff5000'
};

type OSMImageNotesProps = {
  onMapLayerLoaded: (mapLayer: any) => any
  onOSMFeaturePropertiesLoaded?: (osmFeatureProperties: OSMFeatureProps) => any,
  filters: any,
  history: any,
  location: Location,
  match: any,
  showLocation: (location: any) => any,
  requestLocation?: (initial: any) => Promise<any>
}

type OSMImageNotesState = {
  osmImageNotes?: OSMImageNote[],
  error: boolean
  osmFeatureProperties?: OSMFeatureProps
}

const initialState: OSMImageNotesState = {
  error: false
};

class OSMImageNotes extends React.Component<OSMImageNotesProps, OSMImageNotesState> {
  static defaultProps = {
    filters: {}
  };

  private mapLayer?: any;
  private dotMarkers: {[id: string]: any} = {};

  state: OSMImageNotesState = initialState;

  componentDidMount() {
    this.loadImageNotes();
    this.loadOSMFeatureProperties();
  }

  componentDidUpdate(prevProps: OSMImageNotesProps) {
    if (prevProps.filters != this.props.filters) this.getMapLayer();
  }

  loadImageNotes() {
    sessionRequest(osmImageNotesUrl).then((response: any) => {
      if (response.status < 300)
        response.json().then((osmImageNotes: OSMImageNote[]) => {
          this.setState({osmImageNotes});
          this.props.onMapLayerLoaded(this.getMapLayer());
        });
    })
  }

  refreshNote(note: OSMImageNote) {
    return sessionRequest(osmImageNoteUrl(note.id as number))
      .then(response => response.json())
      .then(note => {
        if (!this.state.osmImageNotes) return;
        // Align created_by with how it is serialized in the note list response:
        if (note.created_by.id) note.created_by = note.created_by.id;
        const osmImageNotes = this.state.osmImageNotes.slice();
        const index = osmImageNotes.findIndex(note2 => note2.id == note.id);
        osmImageNotes.splice(index, 1, note);
        this.setState({osmImageNotes});
        this.props.onMapLayerLoaded(this.getMapLayer());
      });
  }

  render() {
    const {osmImageNotes, error, osmFeatureProperties} = this.state;
    const {history, showLocation, requestLocation} = this.props;

    if (!osmImageNotes || !osmFeatureProperties) return '';

    return <Router>
      <Switch>
        {osmImageNotes.map(note =>
          <Route key={note.id} path={`/Notes/${note.id}/`}>
            <OSMImageNoteModal osmFeatureProperties={osmFeatureProperties} note={note}
                               onClose={() => {this.refreshNote(note); history.push('/Notes/')}}
                               showOnMap={() => {showLocation(note); history.push('/Notes/')}}
                               requestLocation={requestLocation}/>
          </Route>
        )}
      </Switch>
    </Router>;
  }

  private getMapLayer() {
    const {filters, history} = this.props;

    if (!this.mapLayer) this.mapLayer = L.layerGroup();
    if (!this.state.osmImageNotes) return this.mapLayer;

    const filterEntries = Object.entries(filters || {});
    const osmImageNotes =
      filters ?
        this.state.osmImageNotes.filter(note => {
          for (const [key, value] of filterEntries) {
            if (value instanceof Array) for (const item of value) {
              // @ts-ignore
              if (!(note[key] || []).includes(item)) return false;
            }
            // @ts-ignore
            else if (note[key] != value) return false;
          }
          return true;
        })
      : this.state.osmImageNotes;

    osmImageNotes.forEach((osmImageNote: OSMImageNote) => {
      const id = String(osmImageNote.id);
      const category =
        (osmImageNote.tags || []).includes('Problem') ? 'problem'
        : osmImageNote.is_reviewed ? 'reviewed'
        : osmImageNote.is_processed ? 'processed'
        : 'new';
      const style = {
        radius: 2,
        color: markerColors[category],
        opacity: 0.05,
        weight: 20,
        fillColor: markerColors[category],
        fillOpacity: 1
      };
      const latLng = {lon: osmImageNote.lon, lat: osmImageNote.lat};
      if (this.dotMarkers[id]) return this.dotMarkers[id].setStyle(style).setLatLng(latLng);
      const marker = L.circleMarker(latLng, style);
      marker.on('click', () => history.push(`/Notes/${id}/`));
      marker.addTo(this.mapLayer);
      this.dotMarkers[id] = marker;
    });

    const index = _.keyBy(osmImageNotes, 'id');
    Object.entries(this.dotMarkers).filter(([id]) => !index[id]).forEach(([id, marker]) => {
      marker.remove();
      delete this.dotMarkers[id];
    });
    return this.mapLayer;
  }

  private loadOSMFeatureProperties() {
    const {onOSMFeaturePropertiesLoaded} = this.props;
    sessionRequest(osmFeaturePropertiesUrl).then((response) => {
      if (response.status < 300)
        response.json().then((osmFeatureProperties) => {
          this.setState({osmFeatureProperties});
          onOSMFeaturePropertiesLoaded && onOSMFeaturePropertiesLoaded(osmFeatureProperties)
        })
    })
  }
}

export default withRouter(OSMImageNotes);
