import React from 'react';
import {OSMImageNote} from "components/types";
import Icon from "util_components/bootstrap/Icon";

// @ts-ignore
import {Button, ButtonGroup} from "reactstrap";
import Confirm from "util_components/bootstrap/Confirm";
import sessionRequest from "sessionRequest";
import {acceptOSMImageNoteUrl, rejectOSMImageNoteUrl, processedOSMImageNoteUrl} from "urls";

type ReviewActionsProps = {
  imageNote: OSMImageNote,
  onReviewed: () => any
}

type ReviewActionsState = {
  confirmAccept: boolean,
  confirmReject: boolean,
  confirmProcessed: boolean
}

const initialState: ReviewActionsState = {
  confirmAccept: false,
  confirmReject: false,
  confirmProcessed: false
};

export default class OSMImageNoteReviewActions extends React.Component<ReviewActionsProps, ReviewActionsState> {
  state = initialState;

  render() {
    const {imageNote} = this.props;
    const {confirmAccept, confirmReject, confirmProcessed} = this.state;

    const osm_edit_url =
      `https://www.openstreetmap.org/edit#map=20/${imageNote.lat}/${imageNote.lon}`;

    return !imageNote.is_reviewed &&
      <ButtonGroup className="btn-block">
        <Button outline color="success" className="btn-compact" size="sm" tag="a" target="_osm_editor"
                href={osm_edit_url}>
          <Icon icon="search"/> OSM
        </Button>

        {!imageNote.is_processed &&
          <Button outline color="success" className="btn-compact" size="sm"
                  onClick={() => this.setState({confirmProcessed: true})}>
            <Icon icon="map"/> Added to OSM
          </Button>
        }

        {!imageNote.is_reviewed &&
          <Button outline color="success" className="btn-compact" size="sm"
                  onClick={() => this.setState({confirmAccept: true})}>
            <Icon icon="done"/> Accept
          </Button>
        }

        {confirmAccept &&
          <Confirm title="Mark this image note as reviewed & accepted?"
                   onClose={() => this.setState({confirmAccept: false})}
                   onConfirm={this.onAccept}/>
        }

        {confirmProcessed &&
          <Confirm title="Mark this image note as added to OSM?"
                   onClose={() => this.setState({confirmProcessed: false})}
                   onConfirm={this.onProcessed}/>
        }

        <Button outline color="danger" className="btn-compact modal-header-action" size="sm"
                onClick={() => this.setState({confirmReject: true})}>
          <Icon icon="delete"/> Reject
        </Button>

        {confirmReject &&
          <Confirm title="Mark this image note as rejected, hiding it from view on the map?"
                   onClose={() => this.setState({confirmReject: false})}
                   inputPlaceholder="Please write here shortly the reason for the rejection."
                   onConfirm={this.onReject}/>
        }
      </ButtonGroup>;
  }

  onReviewed = (url: string, data?: any) => {
    const {imageNote, onReviewed} = this.props;
    sessionRequest(url, {method: 'PUT', data})
    .then((response) => {
      if ((response.status < 300)) {
        imageNote.is_reviewed = true;  // Modifying the props directly, because we operate on the dark side here.
        onReviewed();
      }
    })
  };

  onProcessed = () => {
    this.onReviewed(processedOSMImageNoteUrl(this.props.imageNote.id as number));
  };

  onAccept = () => {
    this.onReviewed(acceptOSMImageNoteUrl(this.props.imageNote.id as number));
  };

  onReject = (hidden_reason?: string) => {
    this.onReviewed(rejectOSMImageNoteUrl(this.props.imageNote.id as number), {hidden_reason});
  };
}
