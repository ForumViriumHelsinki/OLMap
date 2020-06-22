import React from 'react';
// @ts-ignore
import {HashRouter as Router, Route, Switch, withRouter} from "react-router-dom";

// @ts-ignore
import * as L from 'leaflet';
// @ts-ignore
import _ from 'lodash';

import sessionRequest from "sessionRequest";
import {osmFeaturePropertiesUrl, osmImageNotesUrl} from "urls";
import {AppContext, OSMFeatureProps, OSMImageNote} from "components/types";

import 'components/osm_image_notes/OSMImageNotes.css';

import OSMImageNoteModal from "components/osm_image_notes/OSMImageNoteModal";

const dotIcon = L.divIcon({className: "dotIcon", iconSize: [24, 24]});
const processedDotIcon = L.divIcon({className: "dotIcon processedDotIcon", iconSize: [24, 24]});
const successDotIcon = L.divIcon({className: "dotIcon successDotIcon", iconSize: [24, 24]});
const problemDotIcon = L.divIcon({className: "dotIcon problemDotIcon", iconSize: [24, 24]});

type OSMImageNotesProps = {
  onMapLayerLoaded: (mapLayer: any) => any
  onOSMFeaturePropertiesLoaded?: (osmFeatureProperties: OSMFeatureProps) => any,
  myNotesOnly: boolean,
  history: any,
  location: Location,
  match: any,
  showLocation: (location: any) => any
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
  static contextType = AppContext;
  static defaultProps = {
    myNotesOnly: false
  };

  private mapLayer?: any;
  private dotMarkers: {[id: string]: any} = {};

  state: OSMImageNotesState = initialState;

  componentDidMount() {
    this.loadImageNotes();
    this.loadOSMFeatureProperties();
  }

  componentDidUpdate(prevProps: OSMImageNotesProps) {
    if (prevProps.myNotesOnly != this.props.myNotesOnly) this.getMapLayer();
  }

  loadImageNotes() {
    sessionRequest(osmImageNotesUrl).then((response: any) => {
      if (response.status < 300)
        response.json().then((osmImageNotes: OSMImageNote[]) => {
          this.setState({osmImageNotes});
          this.props.onMapLayerLoaded(this.getMapLayer())
        });
    })
  }

  render() {
    const {osmImageNotes, error, osmFeatureProperties} = this.state;
    const {history, showLocation} = this.props;

    if (!osmImageNotes || !osmFeatureProperties) return '';

    return <Router>
      <Switch>
        {osmImageNotes.map(note =>
          <Route key={note.id} path={`/Notes/${note.id}/`}>
            <OSMImageNoteModal osmFeatureProperties={osmFeatureProperties} note={note}
                               onClose={() => {this.loadImageNotes(); history.push('/Notes/')}}
                               showOnMap={() => {showLocation(note); history.push('/Notes/')}}/>
          </Route>
        )}
      </Switch>
    </Router>;
  }

  refresh = () => {
    this.setState(initialState);
    this.loadImageNotes();
  };

  private getMapLayer() {
    const {user} = this.context;
    const {myNotesOnly, history} = this.props;

    if (!this.mapLayer) this.mapLayer = L.layerGroup();
    if (!this.state.osmImageNotes) return this.mapLayer;

    const osmImageNotes =
      myNotesOnly ? this.state.osmImageNotes.filter(n => n.created_by == user.id)
      : this.state.osmImageNotes;

    osmImageNotes.forEach((osmImageNote) => {
      const id = String(osmImageNote.id);
      const icon =
        (osmImageNote.tags || []).includes('Problem') ? problemDotIcon
        : osmImageNote.is_reviewed ? successDotIcon
        : osmImageNote.is_processed ? processedDotIcon
        : dotIcon;
      if (this.dotMarkers[id]) return this.dotMarkers[id].setIcon(icon);
      const marker = L.marker({lon: osmImageNote.lon, lat: osmImageNote.lat}, {icon: icon});
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
