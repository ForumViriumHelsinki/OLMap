import React from "react";

import sessionRequest from "sessionRequest";
import { mapFeatureTypesUrl, osmImageNoteUrl } from "urls";
import { AppContext, MapFeatureTypes, OSMImageNote } from "components/types";
import Modal from "util_components/bootstrap/Modal";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";

import "components/osm_image_notes/OSMImageNotes.css";

import { LocationTuple, Location } from "util_components/types";
import OSMImageNoteTags from "components/osm_image_notes/OSMImageNoteTags";
import ZoomableImage from "util_components/ZoomableImage";
import OSMImageNoteComments from "components/osm_image_notes/OSMImageNoteComments";
import { OSMFeature } from "util_components/osm/types";
import { formatTimestamp } from "utils";
import { userCanEditNote } from "./utils";
import NearbyAddressesAsOSMLoader from "components/osm_image_notes/NearbyAddressesAsOSMLoader";
import MapToolButton from "components/osm_image_notes/MapToolButton";
import OSMImageNoteActionsMenu from "components/osm_image_notes/OSMImageNoteActionsMenu";
import OSMImageNoteAddress from "components/osm_image_notes/OSMImageNoteAddress";
import OSMImageNoteRelatedPlaces from "components/osm_image_notes/OSMImageNoteRelatedPlaces";
import OSMImageNoteMapFeatures from "components/osm_image_notes/OSMImageNoteMapFeatures";

type OSMImageNoteModalProps = {
  mapFeatureTypes?: MapFeatureTypes;
  note: OSMImageNote;
  onClose: () => any;
  showOnMap?: () => any;
  requestLocation?: (fn: (l: Location) => any, initial: any) => any;
  cancelLocationRequest?: () => any;
  fullScreen?: boolean;
};

type OSMImageNoteModalState = {
  note?: OSMImageNote;
  error: boolean;
  nearbyFeatures: OSMFeature[];
  nearbyAddresses: OSMFeature[];
  repositioning: boolean;
  mapFeatureTypes?: MapFeatureTypes;
};

const initialState: OSMImageNoteModalState = {
  error: false,
  nearbyFeatures: [],
  nearbyAddresses: [],
  repositioning: false,
};

export default class OSMImageNoteModal extends React.Component<
  OSMImageNoteModalProps,
  OSMImageNoteModalState
> {
  static contextType = AppContext;
  state: OSMImageNoteModalState = initialState;

  componentDidMount() {
    this.fetchNote();
    if (!this.props.mapFeatureTypes) this.loadMapFeatureTypes();
  }

  componentDidUpdate(prevProps: Readonly<OSMImageNoteModalProps>) {
    if (prevProps && prevProps.note.id != this.props.note.id) this.fetchNote();
  }

  loadMapFeatureTypes() {
    sessionRequest(mapFeatureTypesUrl).then((response) => {
      if (response.status < 300)
        response.json().then((mapFeatureTypes) => {
          this.setState({ mapFeatureTypes });
        });
    });
  }

  render() {
    const { onClose, fullScreen, showOnMap, requestLocation } = this.props;
    const { note, repositioning } = this.state;
    const { user } = this.context;

    if (!note) return null;

    if (repositioning)
      return (
        <div className="mt-4 text-right">
          Scroll map to select position{" "}
          <MapToolButton onClick={this.cancelLocationRequest}>
            Cancel
          </MapToolButton>
        </div>
      );

    const canEdit = userCanEditNote(user, note);
    const adjustPosition =
      canEdit && requestLocation ? this.adjustPosition : undefined;

    const credit = `${
      note.created_by ? (
        typeof note.created_by === 'object' ? note.created_by.username : note.created_by
      ) : "Anonymous"
    } on ${formatTimestamp(note.created_at)}`;

    const title = (
      <>
        <OSMImageNoteActionsMenu
          {...{ showOnMap, note, adjustPosition, canEdit, closeNote: onClose }}
          refreshNote={this.fetchNote}
        />
        {note.comment ? (
          <>
            {note.comment}
            <br />
            by {credit}
          </>
        ) : (
          `Note by ${credit}`
        )}
      </>
    );

    const modalCls = note.image ? "modal-xl" : "modal-dialog-centered";
    return fullScreen ? (
      <>
        <h6 className="pt-2">{title}</h6>
        {this.renderContent()}
      </>
    ) : (
      <Modal
        title={title}
        className={modalCls}
        onClose={onClose}
        headerCls="pl-0 pt-2 pr-2 pb-2"
      >
        {this.renderContent()}
      </Modal>
    );
  }

  renderContent() {
    const mapFeatureTypes =
      this.props.mapFeatureTypes || this.state.mapFeatureTypes;
    const { note, error, nearbyFeatures, nearbyAddresses, repositioning } =
      this.state;
    const { user } = this.context;

    if (repositioning || !note) return null;

    const canEdit = userCanEditNote(user, note);
    const readOnly = !canEdit;
    const location = [note.lon, note.lat] as LocationTuple;
    const tags = note.tags || [];

    return (
      <>
        <ErrorAlert
          status={error}
          message="Saving features failed. Try again perhaps?"
        />
        {note.image && <ZoomableImage src={note.image} className="noteImage" />}

        <OSMImageNoteTags
          {...{ tags, mapFeatureTypes, readOnly }}
          onChange={(tags) => this.updateSelectedNote({ tags })}
        />

        <NearbyAddressesAsOSMLoader
          location={location}
          onLoad={(nearbyAddresses) => this.setState({ nearbyAddresses })}
        />

        <OSMImageNoteAddress
          {...{
            note,
            nearbyAddresses,
            readOnly,
            saveAddresses: this.saveAddresses,
          }}
        />

        <OSMImageNoteRelatedPlaces
          {...{ note, readOnly, saveAddresses: this.saveAddresses }}
          onFeaturesLoaded={(nearbyFeatures) =>
            this.setState({ nearbyFeatures })
          }
          savePlaces={this.onFeaturesSelected}
        />

        {mapFeatureTypes && (
          <OSMImageNoteMapFeatures
            mapFeatureTypes={mapFeatureTypes}
            osmImageNote={note}
            nearbyFeatures={nearbyFeatures.concat(nearbyAddresses)}
            refreshNote={this.fetchNote}
            addNearbyFeature={(f) =>
              this.setState({ nearbyFeatures: [f].concat(nearbyFeatures) })
            }
            onSubmit={(data) => this.updateSelectedNote(data)}
          />
        )}

        <OSMImageNoteComments
          osmImageNote={note}
          refreshNote={this.fetchNote}
        />
      </>
    );
  }

  onFeaturesSelected = (featureIds: number[]) => {
    this.updateSelectedNote({ osm_features: featureIds });
  };

  saveAddresses = (addresses: number[]) => {
    this.updateSelectedNote({ addresses });
  };

  updateSelectedNote(data: any, nextState?: any) {
    const { note } = this.state;
    if (!note) return;
    const url = osmImageNoteUrl(note.id as number);

    sessionRequest(url, { method: "PATCH", data }).then((response) => {
      if (response.status < 300)
        response.json().then((note: OSMImageNote) => {
          this.setState({ note, error: false });
        });
      else this.setState({ error: true });
    });
  }

  fetchNote = () => {
    return sessionRequest(osmImageNoteUrl(this.props.note.id as number))
      .then((response) => response.json())
      .then((note) => this.setState({ note }));
  };

  adjustPosition = () => {
    const { requestLocation, note } = this.props;
    if (!requestLocation) return;
    this.setState({ repositioning: true });

    const onLocationSelected = (location: any) => {
      this.updateSelectedNote(location);
      this.setState({ repositioning: false });
    };
    requestLocation(onLocationSelected, note);
  };

  cancelLocationRequest = () => {
    const { cancelLocationRequest } = this.props;
    cancelLocationRequest && cancelLocationRequest();
    this.setState({ repositioning: false });
  };
}
