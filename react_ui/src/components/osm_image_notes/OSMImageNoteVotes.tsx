import React from "react";
// @ts-ignore
import { Button, ButtonGroup } from "reactstrap";
import { AppContext, OSMImageNote } from "components/types";
import Icon from "util_components/bootstrap/Icon";
import sessionRequest from "sessionRequest";
import { downvoteOSMImageNoteUrl, upvoteOSMImageNoteUrl } from "urls";

type OSMImageNoteVotesProps = {
  osmImageNote: OSMImageNote;
  onUpdate: (note: OSMImageNote) => any;
};

export default class OSMImageNoteVotes extends React.Component<OSMImageNoteVotesProps> {
  static contextType = AppContext;

  buttonProps = {
    outline: true,
    size: "sm",
    className: "btn-compact",
  };

  render() {
    const { osmImageNote } = this.props;
    const upvoteUrl = upvoteOSMImageNoteUrl(osmImageNote.id as number);
    const downvoteUrl = downvoteOSMImageNoteUrl(osmImageNote.id as number);

    return (
      <ButtonGroup className="btn-block">
        <Button
          {...this.buttonProps}
          color="success"
          onClick={() => this.updateNote(upvoteUrl)}
        >
          <Icon icon="thumb_up" /> Useful (
          {osmImageNote.upvotes ? osmImageNote.upvotes.length : 0})
        </Button>
        <Button
          {...this.buttonProps}
          color="danger"
          onClick={() => this.updateNote(downvoteUrl)}
        >
          <Icon icon="thumb_down" /> Not useful (
          {osmImageNote.downvotes ? osmImageNote.downvotes.length : 0})
        </Button>
      </ButtonGroup>
    );
  }

  updateNote = (url: string) => {
    const { onUpdate } = this.props;

    sessionRequest(url, { method: "PUT" }).then((response) => {
      if (response.status < 400)
        response.json().then((note: OSMImageNote) => onUpdate(note));
    });
  };
}
