import React from 'react';

import Map from 'util_components/Map';
// @ts-ignore
import {Button, Spinner} from "reactstrap";
import Icon from "util_components/Icon";
import Component from "util_components/Component";
import {LocationTuple} from "util_components/types";
import Modal from "util_components/Modal";
import ErrorAlert from "util_components/ErrorAlert";

import sessionRequest from "sessionRequest";
import {osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {OSMFeatureProps, OSMImageNote} from "components/types";
import OSMImageNotes from "components/osm_image_notes/OSMImageNotes";
import OSMFeaturesSelection from "util_components/OSMFeaturesSelection";
import OSMFeatureProperties from "components/osm_image_notes/OSMFeatureProperties";
import OSMImageNoteTags from "components/osm_image_notes/OSMImageNoteTags";


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
  myNotesOnly: boolean
}

const initialState: OSMImageNotesEditorState = {
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
  myNotesOnly: false
};

const {imagesUploading, ...resetState} = initialState;

export default class OSMImageNotesEditor extends Component<{}> {
  state: OSMImageNotesEditorState = initialState;

  static bindMethods = [
    'onImageClick', 'onImageCaptured', 'onCommentClick',
    'onLocationSelected', 'onCancel', 'onSubmit', 'reloadNotes'
  ];

  imageNotesRef = React.createRef<OSMImageNotes>();

  styles = {
    mapTools: {zIndex: 500, right: 0, background: 'rgba(255, 255, 255, 0.4)'}
  };

  childProps = {
    toolButton: {outline: true, color: "primary", size: "sm", className: 'bg-white'}
  };

  render() {
    const {
      status, lat, lon, submitting, error, osmImageNotesLayer, imageError, imagesUploading, osmFeatureProperties, tags,
      osmProperties, myNotesOnly
    } = this.state;

    const location = [lon, lat] as LocationTuple;

    return <div className="flex-grow-1">
      <div className="position-absolute map-tools p-3" style={this.styles.mapTools}>
        <input name="image" id="image" className="d-none" type="file"
               accept="image/*" capture="environment"
               onChange={this.onImageCaptured}/>
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
              <Button {...this.childProps.toolButton}
                      className={myNotesOnly ? '' : 'bg-white'}
                      outline={!myNotesOnly}
                      onClick={() => this.setState({myNotesOnly: !myNotesOnly})}>
                <Icon icon="account_circle"/>
              </Button>{' '}
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
              <OSMFeaturesSelection
                location={location}
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
                                            osmImageNote={osmProperties}
                                            onSubmit={(data) => this.addOSMProperties(data)} />
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
      <Map requestLocation={status == 'locating'}
           onLocationSelected={this.onLocationSelected}
           extraLayers={osmImageNotesLayer && [osmImageNotesLayer]}/>
      <OSMImageNotes onMapLayerLoaded={(osmImageNotesLayer: any) => this.setState({osmImageNotesLayer})}
                     onOSMFeaturePropertiesLoaded={(osmFeatureProperties) =>
                       this.setState({osmFeatureProperties})}
                     ref={this.imageNotesRef} myNotesOnly={myNotesOnly}/>
    </div>;
  }

  private addOSMProperties(data: any) {
    this.setState({osmProperties: {...this.state.osmProperties, ...data}});
  }

  private onImageClick() {
    this.imageEl().click();
  }

  private onCommentClick() {
    this.setState({status: 'locating'});
  }

  private imageEl() {
    return document.getElementById('image') as HTMLInputElement;
  }

  private onImageCaptured() {
    const files = this.imageEl().files as FileList;
    this.setState({status: "locating", image: files[0]})
  }

  private onLocationSelected(location: LocationTuple) {
    this.setState({status: "relating", lon: location[0], lat: location[1]});
  }

  private onCancel() {
    this.setState(resetState);
  }

  private onSubmit() {
    const {comment, lon, lat, osm_features, image, imagesUploading, tags, osmProperties} = this.state;
    const fields = {comment, lat, lon, osm_features, tags, ...osmProperties};

    this.setState({submitting: true});

    sessionRequest(osmImageNotesUrl, {method: 'POST', data: fields})
    .then((response: any) => {
      if ((response.status >= 300)) return this.setState({error: true, submitting: false});

      this.setState({...resetState, status: "thanks"});

      if (!image) return this.reloadNotes();

      else response.json().then((data: OSMImageNote) => {
        let formData = new FormData();
        formData.append('image', image);
        this.setState({imagesUploading: imagesUploading.concat([data])})
        sessionRequest(osmImageNoteUrl(data.id as number), {method: 'PATCH', body: formData})
          .then((response: any) => {
            const uploading = this.state.imagesUploading.slice();
            uploading.splice(uploading.indexOf(data, 1))
            this.setState({imagesUploading: uploading});

            if ((response.status >= 300)) this.setState({imageError: true});
            else this.reloadNotes();
          });
      });
    });
  }

  private reloadNotes() {
    this.imageNotesRef.current && this.imageNotesRef.current.loadImageNotes();
  }
}
