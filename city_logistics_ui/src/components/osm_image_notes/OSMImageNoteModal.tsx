import React from 'react';

import sessionRequest from "sessionRequest";
import {osmImageNoteUrl} from "urls";
import {AppContext, OSMFeatureProps, OSMImageNote} from "components/types";
import Modal from "util_components/bootstrap/Modal";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";

import 'components/osm_image_notes/OSMImageNotes.css';

import OSMFeaturesSelection from "util_components/osm/OSMFeaturesSelection";
import {LocationTuple} from "util_components/types";
import OSMImageNoteReviewActions from "components/osm_image_notes/OSMImageNoteReviewActions";
import OSMFeatureProperties from "components/osm_image_notes/OSMFeatureProperties";
import Icon from "util_components/bootstrap/Icon";
import OSMImageNoteTags from "components/osm_image_notes/OSMImageNoteTags";
import ZoomableImage from "util_components/ZoomableImage";
import OSMImageNoteVotes from "components/osm_image_notes/OSMImageNoteVotes";
import OSMImageNoteComments from "components/osm_image_notes/OSMImageNoteComments";
import AssociateEntranceModal from "components/osm_image_notes/AssociateEntranceModal";
import {OSMFeature} from "util_components/osm/types";
import {formatTimestamp} from "utils";
import NearbyAddressesAsOSMLoader from "components/osm_image_notes/NearbyAddressesAsOSMLoader";

type OSMImageNoteModalProps = {
  osmFeatureProperties: OSMFeatureProps,
  note: OSMImageNote,
  onClose: () => any,
  showOnMap?: () => any,
  requestLocation?: (initial: any) => Promise<any>
}

type OSMImageNoteModalState = {
  note?: OSMImageNote,
  readOnly: boolean,
  error: boolean
  nearbyFeatures: OSMFeature[],
  nearbyAddresses: OSMFeature[],
  linkingEntrance?: OSMFeature,
  repositioning: boolean
}

const initialState: OSMImageNoteModalState = {
  readOnly: true,
  error: false,
  nearbyFeatures: [],
  nearbyAddresses: [],
  repositioning: false
};

export default class OSMImageNoteModal extends React.Component<OSMImageNoteModalProps, OSMImageNoteModalState> {
  static contextType = AppContext;
  state: OSMImageNoteModalState = initialState;

  componentDidMount() {
    this.fetchNote();
  }

  componentDidUpdate(prevProps: Readonly<OSMImageNoteModalProps>) {
    if (prevProps && (prevProps.note != this.props.note)) this.fetchNote();
  }

  render() {
    const {osmFeatureProperties, onClose, showOnMap, requestLocation} = this.props;
    const {note, readOnly, error, nearbyFeatures, nearbyAddresses, linkingEntrance, repositioning} = this.state;
    const {user} = this.context;
    const reviewer = user && user.is_reviewer;

    if (repositioning || !note) return null;

    const location = [note.lon, note.lat] as LocationTuple;

    const tags = note.tags || [];

    const editable = reviewer && readOnly;
    const relatedFeatures =
      note.osm_features
        ? nearbyFeatures.filter(f => note.osm_features.includes(f.id))
        : nearbyFeatures;

    // @ts-ignore
    const credit = `${note.created_by.username} on ${formatTimestamp(note.created_at)}`;

    const title = <>
      {showOnMap && <span className="clickable text-primary" onClick={showOnMap}><Icon icon="place"/></span>}
      {' '}
      <span className="clickable text-primary ml-1"
              onClick={this.copyPermalink}>
        <Icon icon="link"/>
      </span>
      {' '}
      {requestLocation && user &&
        <span className="clickable text-primary ml-1" onClick={this.adjustPosition}>
          <Icon icon="open_with"/>
        </span>}
      {' '}
      <textarea id="permalink" value={window.location.href} style={{width: 0, height: 0, opacity: 0}}/>
      {note.comment
        ? <>{note.comment}<br/>by {credit}</>
        : `Note by ${credit}`}
    </>;

    const modalCls = note.image ? 'modal-xl' : 'modal-dialog-centered';

    return <Modal title={title} className={modalCls} onClose={onClose}>
        {reviewer &&
          <OSMImageNoteReviewActions imageNote={note} onReviewed={onClose}/>
        }
        <OSMImageNoteVotes osmImageNote={note} onUpdate={this.fetchNote}/>
        <ErrorAlert status={error} message="Saving features failed. Try again perhaps?"/>
        {note.image && <ZoomableImage src={note.image} className="noteImage"/>}
        <>
          <p className="m-2 ml-3"><strong>Tags:</strong></p>
          <p className="m-2 ml-3">
             <OSMImageNoteTags {...{tags, osmFeatureProperties}} readOnly={!reviewer}
                               onChange={tags => this.updateSelectedNote({tags})}/>
          </p>
        </>
        <div onClick={() => editable && this.setState({readOnly: false})}
             className={editable ? "clickable": ''}>
          <div className="list-group-item">
            <strong>Related places:</strong>
            {editable && <div className="float-right"><Icon icon={'edit'}/></div>}
            {!readOnly &&
              <div className="float-right">
                <button className="btn btn-light btn-sm btn-compact"
                        onClick={() => this.setState({readOnly: true})}>
                  Close <Icon icon={'close'}/>
                </button>
              </div>
            }
          </div>
          <NearbyAddressesAsOSMLoader
            location={location}
            onLoad={nearbyAddresses => this.setState({nearbyAddresses})} />
          <OSMFeaturesSelection
            location={location}
            extraFeatures={nearbyAddresses}
            onChange={this.onFeaturesSelected} readOnly={readOnly}
            maxHeight={null}
            preselectedFeatureIds={note.osm_features}
            onFeaturesLoaded={(nearbyFeatures) => this.setState({nearbyFeatures})}
            featureActions={
              (feature: OSMFeature) =>
                feature.tags.entrance && note.osm_features && note.osm_features.includes(feature.id) &&
                  <button className="btn btn-light btn-compact float-right"
                          onClick={(e) => this.linkEntrance(e, feature)}>
                    <Icon icon="link"/>
                  </button>
            }/>
        </div>
        {reviewer && osmFeatureProperties && this.getRelevantProperties().map((osmFeatureName) =>
          <div key={osmFeatureName} className="mr-2 ml-3">
              <OSMFeatureProperties
                schema={osmFeatureProperties[osmFeatureName]}
                osmImageNote={note}
                osmFeatureName={osmFeatureName}
                nearbyFeatures={nearbyFeatures.concat(nearbyAddresses)}
                onSubmit={(data) => this.updateSelectedNote(data)}/>
          </div>
        )}
        <div className="m-2 ml-3">
          <p>
            <strong>Comments ({(note.comments || []).length}) </strong>
            <button className="btn btn-light btn-sm btn-compact float-right" onClick={this.fetchNote}>
              <Icon icon={'refresh'}/>
            </button>
          </p>
          <OSMImageNoteComments osmImageNote={note} refreshNote={this.fetchNote}/>
        </div>

        {linkingEntrance && <AssociateEntranceModal
          entrance={linkingEntrance}
          nearbyFeatures={relatedFeatures}
          onClose={() => this.setState({linkingEntrance: undefined})}/>}
    </Modal>
  }

  copyPermalink = () => {
    (document.getElementById('permalink') as HTMLInputElement).select();
    document.execCommand('copy');
  };

  onFeaturesSelected = (featureIds: number[]) => {
    this.updateSelectedNote({osm_features: featureIds});
  };

  updateSelectedNote(data: any, nextState?: any) {
    const {note} = this.state;
    if (!note) return;
    const url = osmImageNoteUrl(note.id as number);

    sessionRequest(url, {method: 'PATCH', data})
    .then((response) => {
      if (response.status < 300) response.json().then((note: OSMImageNote) => {
        this.setState({note, error: false});
      });
      else this.setState({error: true});
    })
  }

  fetchNote = () => {
    return sessionRequest(osmImageNoteUrl(this.props.note.id as number))
      .then(response => response.json())
      .then(note => this.setState({note}))
  };

  private getRelevantProperties() {
    const {note} = this.state;
    const {osmFeatureProperties} = this.props;
    if (!note) return [];
    const tags = note.tags || [];
    const allTags = Object.keys(osmFeatureProperties || {});
    return allTags.filter(tag => tags.includes(tag));
  }

  linkEntrance(e: React.MouseEvent, entrance: OSMFeature) {
    e.stopPropagation();
    this.setState({linkingEntrance: entrance})
  }

  adjustPosition = () => {
    const {requestLocation, note} = this.props;
    if (!requestLocation) return;
    this.setState({repositioning: true});
    requestLocation(note).then((location: any) => {
      this.updateSelectedNote(location);
      this.setState({repositioning: false});
    }).catch(() => this.setState({repositioning: false}))
  };
}
