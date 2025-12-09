import React from 'react';

// @ts-ignore
import { Button, Spinner } from 'reactstrap';
import Icon from 'util_components/bootstrap/Icon';
import { LocationTuple, Location } from 'util_components/types';
import Modal from 'util_components/bootstrap/Modal';
import ErrorAlert from 'util_components/bootstrap/ErrorAlert';

import sessionRequest from 'sessionRequest';
import { osmImageNotesUrl, osmImageNoteUrl } from 'urls';
import { ImageNotesContext, OSMImageNote } from 'components/types';
import OSMFeaturesSelection from 'util_components/osm/OSMFeaturesSelection';
import MapFeatureSet from 'components/map_features/MapFeatureSet';
import OSMImageNoteTags from 'components/osm_image_notes/OSMImageNoteTags';
import { OSMFeature } from 'util_components/osm/types';
import NearbyAddressesAsOSMLoader from 'components/osm_image_notes/NearbyAddressesAsOSMLoader';
import Confirm from 'util_components/bootstrap/Confirm';
import MapToolButton from 'components/osm_image_notes/MapToolButton';

type NewOSMImageNoteProps = {
  requestNoteType?: boolean;
  osmFeatures?: number[];
  requestLocation: (cb: (l: Location) => any) => any;
  cancelLocationRequest: () => any;
};

type NewOSMImageNoteState = OSMImageNote & {
  status: 'initial' | 'locating' | 'relating' | 'commenting' | 'thanks';
  submitting: boolean;
  error: boolean;
  imageError: boolean;
  imagesUploading: OSMImageNote[];
  tags: string[];
  mapFeatureSets: any;
  nearbyFeatures: OSMFeature[];
  nearbyAddresses: OSMFeature[];
  chooseNoteType?: boolean;
  confirmCancel?: boolean;
};

const initialState: () => NewOSMImageNoteState = () => ({
  status: 'initial',
  lat: undefined,
  lon: undefined,
  image: undefined,
  comment: '',
  osm_features: [],
  addresses: [],
  error: false,
  imageError: false,
  submitting: false,
  imagesUploading: [],
  tags: [],
  mapFeatureSets: {},
  nearbyFeatures: [],
  nearbyAddresses: [],
});

const { imagesUploading, ...resetState } = initialState();

export default class NewOSMImageNote extends React.Component<
  NewOSMImageNoteProps,
  NewOSMImageNoteState
> {
  state: NewOSMImageNoteState = initialState();
  static contextType = ImageNotesContext;

  render() {
    const { mapFeatureTypes } = this.context;
    const {
      status,
      lat,
      lon,
      submitting,
      error,
      imageError,
      imagesUploading,
      tags,
      mapFeatureSets,
      osm_features,
      nearbyFeatures,
      nearbyAddresses,
      addresses,
      chooseNoteType,
      confirmCancel,
    } = this.state;

    const location = [lon, lat] as LocationTuple;

    return (
      <>
        <input
          name="image"
          id="image"
          className="d-none"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={this.onImageCaptured}
        />

        {imageError && (
          <Modal title="Image error" onClose={() => this.setState({ imageError: false })}>
            There was an error uploading the image. Try again maybe?
          </Modal>
        )}

        {
          {
            initial: (
              <>
                {imagesUploading.length > 0 && (
                  <Button outline disabled size="sm">
                    <Icon icon="cloud_upload" /> {imagesUploading.length} <Spinner size="sm" />
                  </Button>
                )}
                <MapToolButton icon="camera_alt" onClick={this.onImageClick} />
                <MapToolButton icon="comment" onClick={this.onCommentClick} />
              </>
            ),

            locating: (
              <div className="mt-4 text-right">
                Scroll map to select position{' '}
                <MapToolButton onClick={this.onCancel}>Cancel</MapToolButton>
              </div>
            ),
            relating: (
              <Modal title="Choose related places (optional)" onClose={this.onCancel}>
                <NearbyAddressesAsOSMLoader
                  location={location}
                  onLoad={(nearbyAddresses) => this.setState({ nearbyAddresses })}
                />
                <OSMFeaturesSelection
                  location={location}
                  extraFeatures={nearbyAddresses}
                  preselectedFeatureIds={this.props.osmFeatures}
                  onFeaturesLoaded={(nearbyFeatures) => this.setState({ nearbyFeatures })}
                  onSelect={(osm_features, addresses) =>
                    this.setState({
                      osm_features,
                      addresses: addresses || [],
                      status: 'commenting',
                    })
                  }
                />
              </Modal>
            ),
            commenting: (
              <Modal title="Add comment" onClose={this.onCancel}>
                <ErrorAlert status={error} message="Submit failed. Try again maybe?" />
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Describe the problem / note (optional)"
                  onChange={(e) => this.setState({ comment: e.target.value })}
                />
                {mapFeatureTypes && (
                  <>
                    <OSMImageNoteTags
                      {...{ tags, mapFeatureTypes }}
                      expanded
                      onChange={(tags) => this.setState({ tags })}
                    />
                    <div className="ml-2 mr-2">
                      {tags
                        .filter((tag) => mapFeatureTypes[tag])
                        .map((tag) => (
                          <MapFeatureSet
                            key={tag}
                            schema={mapFeatureTypes[tag]}
                            featureTypeName={tag}
                            osmImageNote={{
                              osm_features,
                              addresses,
                              ...mapFeatureSets,
                            }}
                            onSubmit={(data) => this.addMapFeatureSets(data)}
                            nearbyFeatures={nearbyFeatures.concat(nearbyAddresses)}
                            addNearbyFeature={(f) =>
                              this.setState({
                                nearbyFeatures: [f].concat(nearbyFeatures),
                              })
                            }
                          />
                        ))}
                    </div>
                  </>
                )}
                <Button
                  block
                  disabled={submitting}
                  color="primary"
                  size="sm"
                  onClick={submitting ? undefined : this.onSubmit}
                >
                  {submitting ? 'Submitting...' : 'Done'}
                </Button>
              </Modal>
            ),
            thanks: (
              <Modal title="Thank you" onClose={this.onCancel}>
                <p className="m-2">The comment was saved successfully.</p>
                {imagesUploading.length > 0 && (
                  <p className="m-2">
                    {imagesUploading.length} images are uploading in background.
                  </p>
                )}
                <Button block color="primary" size="sm" onClick={this.onCancel}>
                  Close
                </Button>
              </Modal>
            ),
          }[status]
        }

        {chooseNoteType && (
          <Modal
            onClose={() => this.setState({ chooseNoteType: false })}
            title={
              <>
                <p>Add a new picture or textual note on the map:</p>
                <MapToolButton icon="camera_alt" onClick={this.onImageClick}>
                  Open camera
                </MapToolButton>
                <MapToolButton icon="comment" onClick={this.onCommentClick}>
                  Add text
                </MapToolButton>
              </>
            }
          />
        )}
        {confirmCancel && (
          <Confirm
            title="Close without saving?"
            onConfirm={this.onConfirmCancel}
            onClose={() => this.setState({ confirmCancel: false })}
          />
        )}
      </>
    );
  }

  componentDidMount() {
    const { requestNoteType } = this.props;
    if (requestNoteType) this.setState({ chooseNoteType: true });
  }

  private addMapFeatureSets(data: any) {
    this.setState({
      mapFeatureSets: { ...this.state.mapFeatureSets, ...data },
    });
  }

  onImageClick = () => {
    this.imageEl().click();
    this.setState({ chooseNoteType: false });
  };

  onCommentClick = () => {
    this.props.requestLocation(this.onLocationSelected);
    this.setState({ status: 'locating', chooseNoteType: false });
  };

  private imageEl() {
    return document.getElementById('image') as HTMLInputElement;
  }

  onImageCaptured = () => {
    const files = this.imageEl().files as FileList;
    this.props.requestLocation(this.onLocationSelected);
    this.setState({ status: 'locating', image: files[0] });
  };

  onLocationSelected = (location?: Location) => {
    if (location) this.setState({ status: 'relating', ...location });
    else this.setState(resetState);
  };

  onCancel = () => {
    const status = this.state.status;
    if (status == 'commenting') this.setState({ confirmCancel: true });
    else {
      if (status == 'locating') this.props.cancelLocationRequest();
      this.setState(resetState);
    }
  };

  onConfirmCancel = () => {
    this.setState(resetState);
  };

  onSubmit = () => {
    const {
      comment,
      lon,
      lat,
      osm_features,
      addresses,
      image,
      imagesUploading,
      tags,
      mapFeatureSets,
    } = this.state;
    const fields = {
      comment,
      lat,
      lon,
      osm_features,
      addresses,
      tags,
      ...mapFeatureSets,
    };
    const { addNote } = this.context;

    this.setState({ submitting: true });

    sessionRequest(osmImageNotesUrl, { method: 'POST', data: fields }).then((response: any) => {
      if (response.status >= 300) return this.setState({ error: true, submitting: false });
      response.json().then((data: OSMImageNote) => {
        this.setState({ ...resetState, status: 'thanks' });

        if (!image) {
          addNote(data);
          return;
        }

        let formData = new FormData();
        formData.append('image', image);
        this.setState({ imagesUploading: imagesUploading.concat([data]) });
        sessionRequest(osmImageNoteUrl(data.id as number), {
          method: 'PATCH',
          body: formData,
        }).then((response: any) => {
          const uploading = this.state.imagesUploading.slice();
          uploading.splice(uploading.indexOf(data, 1));
          this.setState({ imagesUploading: uploading });

          if (response.status >= 300) this.setState({ imageError: true });
          addNote(data);
        });
      });
    });
  };
}
