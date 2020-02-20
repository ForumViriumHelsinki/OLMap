import React, {CSSProperties} from 'react';

// @ts-ignore
import * as L from 'leaflet';
// @ts-ignore
import _ from 'lodash';

import sessionRequest from "sessionRequest";
import {osmFeaturePropertiesUrl, osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {AppContext, OSMFeatureProps, OSMImageNote} from "components/types";
import Modal from "util_components/Modal";
import ErrorAlert from "util_components/ErrorAlert";

import 'components/osm_image_notes/OSMImageNotes.css';
import OSMFeaturesSelection from "util_components/OSMFeaturesSelection";
import {LocationTuple, OSMFeature} from "util_components/types";
import Component from "util_components/Component";
import OSMImageNoteReviewActions from "components/osm_image_notes/OSMImageNoteReviewActions";
import PillsSelection from "util_components/PillsSelection";
import OSMFeatureProperties from "components/osm_image_notes/OSMFeatureProperties";

const dotIcon = L.divIcon({className: "dotIcon", iconSize: [24, 24]});
const successDotIcon = L.divIcon({className: "dotIcon successDotIcon", iconSize: [24, 24]});

type OSMImageNotesProps = {
  onMapLayerLoaded: (mapLayer: any) => any
  onOSMFeaturePropertiesLoaded?: (osmFeatureProperties: OSMFeatureProps) => any
}

type OSMImageNotesState = {
  selectedNote?: OSMImageNote,
  readOnly: boolean,
  error: boolean
  osmFeatureProperties?: OSMFeatureProps,
  nearbyFeatures: OSMFeature[]
}

const initialState: OSMImageNotesState = {
  readOnly: true,
  error: false,
  selectedNote: undefined,
  nearbyFeatures: []
};

export default class OSMImageNotes extends Component<OSMImageNotesProps, OSMImageNotesState> {
  static contextType = AppContext;
  static bindMethods = ['onFeaturesSelected', 'refresh', 'toggleTag'];

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
    this.loadOSMFeatureProperties();
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
    const {selectedNote, readOnly, error, osmFeatureProperties, nearbyFeatures} = this.state;
    const {user} = this.context;
    if (!selectedNote) return '';

    const location = [selectedNote.lon, selectedNote.lat] as LocationTuple;

    const tags = selectedNote.tags || [];
    const allTags = Object.keys(osmFeatureProperties || {});

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
        <>
          <p className="m-2 ml-3"><strong>Tags:</strong></p>
          <p className="m-2 ml-3">
            {user.is_reviewer ?
               <PillsSelection options={allTags} selected={tags} onClick={this.toggleTag}/>
             :
              (tags.length > 0) ? <PillsSelection options={tags} selected={tags}/>
              : 'No tags selected.'
            }
          </p>
        </>
        <div className="list-group-item"><strong>Related places:</strong></div>
        <div onClick={() => user.is_reviewer && readOnly && this.setState({readOnly: false})}>
          <OSMFeaturesSelection
            location={location} onSelect={this.onFeaturesSelected} readOnly={readOnly}
            maxHeight={null}
            preselectedFeatureIds={selectedNote.osm_features}
            onFeaturesLoaded={(nearbyFeatures) => this.setState({nearbyFeatures})} />
        </div>
        {osmFeatureProperties && this.getRelevantProperties().map((osmFeatureName) =>
          <div key={osmFeatureName} className="mr-2 ml-3">
              <OSMFeatureProperties
                schema={osmFeatureProperties[osmFeatureName]}
                osmImageNote={selectedNote}
                osmFeatureName={osmFeatureName}
                nearbyFeatures={nearbyFeatures}
                onSubmit={(data) => this.updateSelectedNote(data)}/>
          </div>
        )}
      </Modal>
    )
  }

  private refresh() {
    this.setState(initialState);
    this.loadImageNotes();
  }

  onFeaturesSelected(featureIds: number[]) {
    this.updateSelectedNote({osm_features: featureIds}, {readOnly: true});
  }

  updateSelectedNote(data: any, nextState?: any) {
    const {selectedNote} = this.state;
    if (!selectedNote) return;
    const url = osmImageNoteUrl(selectedNote.id as number);

    sessionRequest(url, {method: 'PATCH', data})
    .then((response) => {
      if (response.status < 300) response.json().then((note: OSMImageNote) => {
        Object.assign(selectedNote, note);
        this.setState({error: false, selectedNote: note, ...(nextState || {})});
      });
      else this.setState({error: true});
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

  private loadOSMFeatureProperties() {
    const {onOSMFeaturePropertiesLoaded} = this.props;
    sessionRequest(osmFeaturePropertiesUrl).then((response) => {
      if (response.status < 300)
        response.json().then((osmFeatureProperties) => {
          this.setState({osmFeatureProperties})
          onOSMFeaturePropertiesLoaded && onOSMFeaturePropertiesLoaded(osmFeatureProperties)
        })
    })
  }

  private toggleTag(tag: string) {
    const {selectedNote} = this.state;
    if (!selectedNote) return;
    const tags = (selectedNote.tags || []).slice();
    if (tags.includes(tag)) tags.splice(tags.indexOf(tag), 1);
    else tags.push(tag);
    this.updateSelectedNote({tags});
  }

  private getRelevantProperties() {
    const {selectedNote, osmFeatureProperties} = this.state;
    if (!selectedNote) return [];
    const tags = selectedNote.tags || [];
    const allTags = Object.keys(osmFeatureProperties || {});
    return allTags.filter(tag => tags.includes(tag));
  }
}
