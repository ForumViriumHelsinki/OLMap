import React from 'react';
// @ts-ignore
import _ from 'lodash';

import MyPositionMap from 'util_components/MyPositionMap';
// @ts-ignore
import {Button, Spinner} from "reactstrap";
import Icon from "util_components/bootstrap/Icon";
import {LocationTuple} from "util_components/types";
import Modal, {ModalBody} from "util_components/bootstrap/Modal";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";

import sessionRequest from "sessionRequest";
import {osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {OSMFeatureProps, OSMImageNote} from "components/types";
import OSMImageNotes from "components/osm_image_notes/OSMImageNotes";
import OSMFeaturesSelection from "util_components/osm/OSMFeaturesSelection";
import OSMFeatureProperties from "components/osm_image_notes/OSMFeatureProperties";
import OSMImageNoteTags from "components/osm_image_notes/OSMImageNoteTags";
import {changeset, OSMFeature} from "util_components/osm/types";
import OSMChangesetSelection from "util_components/osm/OSMChangesetSelection";
import OSMChangesetMapLayer from "util_components/osm/OSMChangesetMapLayer";
import NearbyAddressesAsOSMLoader from "components/osm_image_notes/NearbyAddressesAsOSMLoader";
import OSMImageNoteFiltersButton from "components/osm_image_notes/OSMImageNoteFiltersButton";
import NotificationsButton from "components/osm_image_notes/NotificationsButton";
import Confirm from "util_components/bootstrap/Confirm";


type OSMImageNotesEditorProps = {
  selectedNoteId?: number,
  newNote?: boolean,
  osmFeatures?: number[]
}

type OSMImageNotesEditorState = OSMImageNote & {
  status: 'initial' | 'locating' | 'relating' | 'commenting' | 'thanks',
  submitting: boolean,
  error: boolean,
  imageError: boolean,
  osmImageNotesLayer?: any,
  imagesUploading: OSMImageNote[],
  osmFeatureProperties?: OSMFeatureProps,
  tags: string[],
  osmProperties: any,
  filters: any,
  nearbyFeatures: OSMFeature[],
  nearbyAddresses: OSMFeature[],
  selectChangeset: boolean,
  selectedChangeset?: changeset,
  onLocationSelected?: (location: any) => any,
  onLocationCancelled?: () => any,
  requestPhoto?: boolean,
  confirmCancel?: boolean
}

const initialState: () => OSMImageNotesEditorState = () => ({
  status: 'initial',
  lat: undefined,
  lon: undefined,
  image: undefined,
  comment: '',
  osm_features: [],
  error: false,
  imageError: false,
  submitting: false,
  imagesUploading: [],
  tags: [],
  osmProperties: {},
  filters: {},
  nearbyFeatures: [],
  nearbyAddresses: [],
  selectChangeset: false
});

const {imagesUploading, ...resetState} = initialState();

export default class OSMImageNotesEditor extends React.Component<OSMImageNotesEditorProps, OSMImageNotesEditorState> {
  state: OSMImageNotesEditorState = initialState();

  imageNotesRef = React.createRef();
  changesetLayerRef = React.createRef<OSMChangesetMapLayer>();
  mapRef = React.createRef<MyPositionMap>();

  childProps = {
    toolButton: {outline: true, color: "primary", size: "sm", className: 'bg-white'}
  };

  render() {
    const {
      status, lat, lon, submitting, error, osmImageNotesLayer, imageError, imagesUploading, osmFeatureProperties, tags,
      osmProperties, filters, osm_features, nearbyFeatures, selectChangeset, selectedChangeset, nearbyAddresses,
      requestPhoto, confirmCancel
    } = this.state;

    const location = [lon, lat] as LocationTuple;

    return <div className="flex-grow-1">
      <div className="position-absolute map-tools p-3">
        <input name="image" id="image" className="d-none" type="file"
               accept="image/*" capture="environment"
               onChange={this.onImageCaptured}/>

        {selectChangeset &&
          <Modal title="Select OSM changeset" onClose={() => this.setState({selectChangeset: false})}>
            <ModalBody>
              <OSMChangesetSelection changeset={selectedChangeset}
                                     onCancel={() => this.setState({selectChangeset: false})}
                                     onSelect={this.selectChangeset} />
            </ModalBody>
          </Modal>
        }
        <OSMChangesetMapLayer ref={this.changesetLayerRef} />

        {imageError &&
          <Modal title="Image error" onClose={() => this.setState({imageError: false})}>
            There was an error uploading the image. Try again maybe?
          </Modal>
        }

        {{
          initial:
            <>
              {imagesUploading.length > 0 &&
                <Button outline disabled size="sm">
                  <Icon icon="cloud_upload"/> {imagesUploading.length} <Spinner size="sm"/>
                </Button>
              }
              <Button {...this.childProps.toolButton} onClick={this.onImageClick}>
                <Icon icon="camera_alt"/>
              </Button>{' '}
              <Button {...this.childProps.toolButton} onClick={this.onCommentClick}>
                <Icon icon="comment"/>
              </Button>{' '}
              <Button {...this.childProps.toolButton} onClick={this.reloadNotes}>
                <Icon icon="refresh"/>
              </Button>{' '}
              <OSMImageNoteFiltersButton onFiltersChanged={filters => this.setState({filters})}
                                         osmFeatureProperties={osmFeatureProperties} />
              {' '}
              <Button {...this.childProps.toolButton} tag="a" href="/editing-process.html" target="_blank">
                <Icon icon="help"/>
              </Button>{' '}
              <Button {...this.childProps.toolButton} onClick={() => this.setState({selectChangeset: true})}>
                <Icon icon="compare_arrows"/>
              </Button>{' '}
              <NotificationsButton/>
            </>,
          locating:
            <div className="mt-4 text-right">
              Scroll map to select position{' '}
              <Button  {...this.childProps.toolButton} onClick={this.onCancel}>
                Cancel
              </Button>
            </div>,
          relating:
            <Modal title="Choose related places (optional)" onClose={this.onCancel}>
              <NearbyAddressesAsOSMLoader
                location={location}
                onLoad={nearbyAddresses => this.setState({nearbyAddresses})} />
              <OSMFeaturesSelection
                location={location}
                extraFeatures={nearbyAddresses}
                preselectedFeatureIds={this.props.osmFeatures}
                onFeaturesLoaded={(nearbyFeatures) => this.setState({nearbyFeatures})}
                onSelect={osm_features => this.setState({osm_features, status: 'commenting'})}/>
            </Modal>,
          commenting:
            <Modal title="Add comment" onClose={this.onCancel}>
              <ErrorAlert status={error} message="Submit failed. Try again maybe?"/>
              <textarea className="form-control" rows={5}
                        placeholder="Describe the problem / note (optional)"
                        onChange={(e) =>
                          this.setState({comment: e.target.value})} />
              {osmFeatureProperties &&
                <>
                  <p className="m-2">Select tags:</p>
                  <p className="m-2">
                    <OSMImageNoteTags {...{tags, osmFeatureProperties}} onChange={tags => this.setState({tags})}/>
                  </p>
                  <div className="ml-2 mr-2">
                    {tags.filter(tag => osmFeatureProperties[tag]).map((tag) =>
                      <OSMFeatureProperties key={tag} schema={osmFeatureProperties[tag]} osmFeatureName={tag}
                                            osmImageNote={{osm_features, ...osmProperties}}
                                            onSubmit={(data) => this.addOSMProperties(data)}
                                            nearbyFeatures={nearbyFeatures.concat(nearbyAddresses)}/>
                    )}
                  </div>
                </>
              }
              <Button block disabled={submitting} color="primary" size="sm"
                      onClick={submitting ? undefined : this.onSubmit}>
                {submitting ? 'Submitting...' : 'Done'}
              </Button>
            </Modal>,
          thanks:
            <Modal title="Thank you" onClose={this.onCancel}>
              <p className="m-2">The comment was saved successfully.</p>
              {imagesUploading.length > 0 &&
                <p className="m-2">{imagesUploading.length} images are uploading in background.</p>
              }
              <Button block color="primary" size="sm" onClick={this.onCancel}>
                Close
              </Button>
            </Modal>,
        }[status]}
      </div>
      <MyPositionMap requestLocation={status == 'locating'}
                     ref={this.mapRef}
                     onLocationSelected={this.onLocationSelected}
                     extraLayers={_.filter([osmImageNotesLayer, this.getChangesetMapLayer()])}/>
      <OSMImageNotes onMapLayerLoaded={(osmImageNotesLayer: any) => this.setState({osmImageNotesLayer})}
                     onOSMFeaturePropertiesLoaded={(osmFeatureProperties: OSMFeatureProps) =>
                       this.setState({osmFeatureProperties})}
                     wrappedComponentRef={this.imageNotesRef} filters={filters}
                     showLocation={this.showLocation} requestLocation={this.requestLocation}
                     selectedNoteId={this.props.selectedNoteId} />
      {requestPhoto &&
        <Modal onClose={() => this.setState({requestPhoto: false})} title={<>
            <p>Add a new picture or textual note on the map:</p>
            <Button {...this.childProps.toolButton} onClick={this.onImageClick} className="mr-2">
              <Icon icon="camera_alt"/> Open camera
            </Button>{' '}
            <Button {...this.childProps.toolButton}
                    onClick={() => this.setState({requestPhoto: false, status: 'locating'})}>
              <Icon icon="comment"/> Add text
            </Button>{' '}
          </>}
        />
      }
      {confirmCancel &&
        <Confirm title="Close without saving?"
                 onConfirm={this.onConfirmCancel}
                 onClose={() => this.setState({confirmCancel: false})}/>
      }
    </div>;
  }

  componentDidMount() {
    const {newNote} = this.props;
    if (newNote) this.setState({requestPhoto: true});
  }

  showLocation = (location: any) => {
    if (!this.mapRef.current) return;
    this.mapRef.current.showLocation(location);
  };

  requestLocation = (initial: any) => {
    if (!this.mapRef.current) return;
    this.mapRef.current.showLocation(initial);
    this.setState({status: 'locating'});
    return new Promise(
      (resolve, reject) => this.setState({onLocationSelected: resolve, onLocationCancelled: reject}));
  };

  private getChangesetMapLayer() {
    const {selectedChangeset} = this.state;
    return this.changesetLayerRef.current && this.changesetLayerRef.current.getMapLayer(selectedChangeset);
  }

  private addOSMProperties(data: any) {
    this.setState({osmProperties: {...this.state.osmProperties, ...data}});
  }

  onImageClick = () => {
    this.imageEl().click();
    this.setState({requestPhoto: false});
  };

  onCommentClick = () => {
    this.setState({status: 'locating'});
  };

  private imageEl() {
    return document.getElementById('image') as HTMLInputElement;
  }

  onImageCaptured = () => {
    const files = this.imageEl().files as FileList;
    this.setState({status: "locating", image: files[0]})
  };

  onLocationSelected = (location: LocationTuple) => {
    const {onLocationSelected} = this.state;
    if (onLocationSelected) {
      this.setState({onLocationSelected: undefined, onLocationCancelled: undefined, status: 'initial'});
      onLocationSelected({lon: location[0], lat: location[1]});
    }
    else this.setState({status: "relating", lon: location[0], lat: location[1]});
  };

  onCancel = () => {
    const {onLocationCancelled} = this.state;
    if (onLocationCancelled) {
      onLocationCancelled();
      this.setState({onLocationSelected: undefined, onLocationCancelled: undefined, status: 'initial'});
    }
    if (this.state.status == 'commenting') this.setState({confirmCancel: true});
    else this.setState(resetState);
  };

  onConfirmCancel = () => {
    this.setState(resetState);
  };

  onSubmit = () => {
    const {comment, lon, lat, osm_features, image, imagesUploading, tags, osmProperties} = this.state;
    const fields = {comment, lat, lon, osm_features, tags, ...osmProperties};

    this.setState({submitting: true});

    sessionRequest(osmImageNotesUrl, {method: 'POST', data: fields})
    .then((response: any) => {
      if ((response.status >= 300)) return this.setState({error: true, submitting: false});
      response.json().then((data: OSMImageNote) => {
        this.setState({...resetState, status: "thanks"});

        if (!image) {
          if (this.imageNotesRef.current) // @ts-ignore
            this.imageNotesRef.current.addNote(data);
          return;
        }

        let formData = new FormData();
        formData.append('image', image);
        this.setState({imagesUploading: imagesUploading.concat([data])});
        sessionRequest(osmImageNoteUrl(data.id as number), {method: 'PATCH', body: formData})
        .then((response: any) => {
          const uploading = this.state.imagesUploading.slice();
          uploading.splice(uploading.indexOf(data, 1));
          this.setState({imagesUploading: uploading});

          if ((response.status >= 300)) this.setState({imageError: true});
          else if (this.imageNotesRef.current) { // @ts-ignore
            this.imageNotesRef.current.addNote(data);
          }
        });
      });
    });
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
