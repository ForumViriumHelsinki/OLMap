import React from 'react';
// @ts-ignore
import _ from 'lodash';

import MyPositionMap from 'util_components/MyPositionMap';
// @ts-ignore
import {Button} from "reactstrap";
import Icon from "util_components/bootstrap/Icon";
import {LocationTuple, Location} from "util_components/types";
import Modal, {ModalBody} from "util_components/bootstrap/Modal";

import sessionRequest from "sessionRequest";
import {osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {MapFeatureTypes, OSMImageNote} from "components/types";
import OSMImageNotes from "components/osm_image_notes/OSMImageNotes";
import {changeset, OSMFeature} from "util_components/osm/types";
import OSMChangesetSelection from "util_components/osm/OSMChangesetSelection";
import OSMChangesetMapLayer from "util_components/osm/OSMChangesetMapLayer";
import OSMImageNoteFiltersButton from "components/osm_image_notes/OSMImageNoteFiltersButton";
import NotificationsButton from "components/osm_image_notes/NotificationsButton";
import NewOSMImageNote from "components/osm_image_notes/NewOSMImageNote";


type OSMImageNotesEditorProps = {
  selectedNoteId?: number,
  newNote?: boolean,
  osmFeatures?: number[]
}

type OSMImageNotesEditorState = {
  error: boolean,
  osmImageNotesLayer?: any,
  mapFeatureTypes?: MapFeatureTypes,
  filters: any,
  selectChangeset: boolean,
  selectedChangeset?: changeset,
  requestingLocation?: boolean,
  onLocationSelected?: (location: any) => any,
  onLocationCancelled?: () => any
}

const initialState: () => OSMImageNotesEditorState = () => ({
  error: false,
  filters: {},
  selectChangeset: false
});

export default class OSMImageNotesEditor extends React.Component<OSMImageNotesEditorProps, OSMImageNotesEditorState> {
  state: OSMImageNotesEditorState = initialState();

  imageNotesRef = React.createRef();
  changesetLayerRef = React.createRef<OSMChangesetMapLayer>();
  mapRef = React.createRef<MyPositionMap>();

  childProps = {
    toolButton: {outline: true, color: "primary", size: "sm", className: 'bg-white'}
  };

  render() {
    const {newNote, osmFeatures} = this.props;
    const {
      osmImageNotesLayer, mapFeatureTypes, filters, selectChangeset, selectedChangeset,
      requestingLocation
    } = this.state;

    return <div className="flex-grow-1">
      <div className="position-absolute map-tools p-3">
        {selectChangeset &&
          <Modal title="Select OSM changeset" onClose={() => this.setState({selectChangeset: false})}>
            <ModalBody>
              <OSMChangesetSelection changeset={selectedChangeset}
                                     onCancel={() => this.setState({selectChangeset: false})}
                                     onSelect={this.selectChangeset} />
            </ModalBody>
          </Modal>
        }

        <NewOSMImageNote mapFeatureTypes={mapFeatureTypes}
                         requestNoteType={newNote}
                         osmFeatures={osmFeatures}
                         requestLocation={this.requestLocation}
                         cancelLocationRequest={this.cancelLocationRequest}
                         onNoteAdded={this.onNoteAdded} />

        {!requestingLocation && <>
          <Button {...this.childProps.toolButton} onClick={this.reloadNotes}>
            <Icon icon="refresh"/>
          </Button>{' '}
          <OSMImageNoteFiltersButton onFiltersChanged={filters => this.setState({filters})}
                                     mapFeatureTypes={mapFeatureTypes} />
          {' '}
          <Button {...this.childProps.toolButton} tag="a" href="/editing-process.html" target="_blank">
            <Icon icon="help"/>
          </Button>{' '}
          <Button {...this.childProps.toolButton} onClick={() => this.setState({selectChangeset: true})}>
            <Icon icon="compare_arrows"/>
          </Button>{' '}
          <NotificationsButton/>
        </>}

        <OSMChangesetMapLayer ref={this.changesetLayerRef} />
      </div>
      <MyPositionMap requestLocation={requestingLocation}
                     ref={this.mapRef}
                     onLocationSelected={this.onLocationSelected}
                     extraLayers={_.filter([osmImageNotesLayer, this.getChangesetMapLayer()])}/>
      <OSMImageNotes onMapLayerLoaded={(osmImageNotesLayer: any) => this.setState({osmImageNotesLayer})}
                     onMapFeatureTypesLoaded={(mapFeatureTypes: MapFeatureTypes) =>
                       this.setState({mapFeatureTypes})}
                     wrappedComponentRef={this.imageNotesRef} filters={filters}
                     showLocation={this.showLocation} requestLocation={this.requestLocation}
                     selectedNoteId={this.props.selectedNoteId} />
    </div>;
  }

  showLocation = (location: any) => {
    if (!this.mapRef.current) return;
    this.mapRef.current.showLocation(location);
  };

  requestLocation = (initial?: any) => {
    if (!this.mapRef.current) return Promise.resolve(undefined);
    if (initial) this.mapRef.current.showLocation(initial);
    this.setState({requestingLocation: true});
    return new Promise(
      (resolve, reject) => this.setState({onLocationSelected: resolve, onLocationCancelled: reject})
    ) as Promise<Location>;
  };

  cancelLocationRequest = () => {
    const {onLocationCancelled} = this.state;
    if (onLocationCancelled) {
      onLocationCancelled();
      this.setState({onLocationSelected: undefined, onLocationCancelled: undefined, requestingLocation: false});
    }
  };

  private getChangesetMapLayer() {
    const {selectedChangeset} = this.state;
    return this.changesetLayerRef.current && this.changesetLayerRef.current.getMapLayer(selectedChangeset);
  }

  onLocationSelected = (location: LocationTuple) => {
    const {onLocationSelected} = this.state;
    if (onLocationSelected) {
      this.setState({onLocationSelected: undefined, onLocationCancelled: undefined, requestingLocation: false});
      onLocationSelected({lon: location[0], lat: location[1]});
    }
  };

  onNoteAdded = (note: OSMImageNote) => {
    if (this.imageNotesRef.current) // @ts-ignore
      this.imageNotesRef.current.addNote(note);
  };

  reloadNotes = () => {
    // @ts-ignore
    this.imageNotesRef.current && this.imageNotesRef.current.loadImageNotes();
  };

  selectChangeset = (selectedChangeset: any) => {
    this.setState({selectedChangeset, selectChangeset: false});
    if (this.mapRef.current) this.mapRef.current.showPoints(
      _.flatten([selectedChangeset.created, selectedChangeset.modified, selectedChangeset.deleted]))
  }
}
