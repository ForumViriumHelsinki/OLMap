import React from "react";
import { AppContext, OSMImageNote } from "components/types";
import Icon from "util_components/bootstrap/Icon";

import Confirm from "util_components/bootstrap/Confirm";
import sessionRequest from "sessionRequest";
import {
  acceptOSMImageNoteUrl,
  rejectOSMImageNoteUrl,
  processedOSMImageNoteUrl,
  reviewedOSMImageNoteUrl,
} from "urls";
import { userCanEditNote } from "components/osm_image_notes/utils";

type ReviewActionsProps = {
  imageNote: OSMImageNote;
  onReviewed: () => any;
};

type ReviewActionsState = {
  confirmAccept: boolean;
  confirmReject: boolean;
  confirmProcessed: boolean;
};

const initialState: ReviewActionsState = {
  confirmAccept: false,
  confirmReject: false,
  confirmProcessed: false,
};

export default class OSMImageNoteReviewActions extends React.Component<
  ReviewActionsProps,
  ReviewActionsState
> {
  static contextType = AppContext;
  state = initialState;

  render() {
    const { imageNote } = this.props;
    const { confirmAccept, confirmReject, confirmProcessed } = this.state;
    const { user } = this.context;
    const canEdit = userCanEditNote(user, imageNote);

    return (
      canEdit && (
        <>
          <h6 className="dropdown-header">Mark note as:</h6>
          {!imageNote.is_accepted &&
            !imageNote.is_processed &&
            user &&
            user.is_reviewer && (
              <button className="dropdown-item" onClick={this.onAccept}>
                <Icon icon="map" /> Ready for OSM
              </button>
            )}

          {imageNote.is_accepted && !imageNote.is_processed && user && (
            <button
              className="dropdown-item"
              onClick={() => this.setState({ confirmProcessed: true })}
            >
              <Icon icon="map" /> Added to OSM
            </button>
          )}

          {!imageNote.is_reviewed && user && user.is_reviewer && (
            <button
              className="dropdown-item"
              onClick={() => this.setState({ confirmAccept: true })}
            >
              <Icon icon="done" /> Reviewed in OSM
            </button>
          )}

          {confirmAccept && (
            <Confirm
              title="Mark this image note as reviewed & accepted in OSM?"
              onClose={() => this.setState({ confirmAccept: false })}
              onConfirm={this.onReviewed}
            />
          )}

          {confirmProcessed && (
            <Confirm
              title="Mark this image note as added to OSM?"
              onClose={() => this.setState({ confirmProcessed: false })}
              onConfirm={this.onProcessed}
            />
          )}

          {canEdit && (
            <button
              className="dropdown-item"
              onClick={() => this.setState({ confirmReject: true })}
            >
              <Icon icon="delete" /> Rejected
            </button>
          )}

          {confirmReject && (
            <Confirm
              title="Mark this image note as rejected, hiding it from view on the map?"
              onClose={() => this.setState({ confirmReject: false })}
              inputPlaceholder="Please write here shortly the reason for the rejection."
              onConfirm={this.onReject}
            />
          )}
        </>
      )
    );
  }

  registerAction = (url: string, data?: any) => {
    const { imageNote, onReviewed } = this.props;
    sessionRequest(url, { method: "PUT", data }).then((response) => {
      if (response.status < 300) {
        imageNote.is_reviewed = true; // Modifying the props directly, because we operate on the dark side here.
        onReviewed();
      }
    });
  };

  onAccept = () => {
    this.registerAction(
      acceptOSMImageNoteUrl(this.props.imageNote.id as number),
    );
  };

  onProcessed = () => {
    this.registerAction(
      processedOSMImageNoteUrl(this.props.imageNote.id as number),
    );
  };

  onReviewed = () => {
    this.registerAction(
      reviewedOSMImageNoteUrl(this.props.imageNote.id as number),
    );
  };

  onReject = (hidden_reason?: string) => {
    this.registerAction(
      rejectOSMImageNoteUrl(this.props.imageNote.id as number),
      { hidden_reason },
    );
  };
}
