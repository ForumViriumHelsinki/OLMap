import React from 'react';
// @ts-ignore
import {Button} from 'reactstrap';
import {OSMImageNote} from "components/types";
import {formatTimestamp} from "utils";
import sessionRequest from "sessionRequest";
import {osmImageNoteCommentsUrl, osmImageNoteUrl} from "urls";
import ErrorAlert from "util_components/ErrorAlert";

type OSMImageNoteCommentsProps = {
  osmImageNote: OSMImageNote,
  refreshNote: () => any
}

type OSMImageNoteCommentsState = {
  error: boolean
}

const initialState: OSMImageNoteCommentsState = {
  error: false
};

export default class OSMImageNoteComments extends React.Component<OSMImageNoteCommentsProps> {
  state = initialState;

  render() {
    const {osmImageNote} = this.props;
    const {error} = this.state;
    const comments = osmImageNote.comments || [];

    return <>
      {comments.map(comment =>
        <div key={comment.id} className="mb-2 mt-2">
          <strong>{comment.user} {formatTimestamp(comment.created_at)}:</strong><br/>
          {comment.comment}
        </div>
      )}
      <ErrorAlert message="Commenting failed. Try again maybe?" status={error}/>
      <textarea className="form-control" placeholder="Write your comment here" id="new-comment"/>
      <Button className="btn-block" color="primary" onClick={this.submit}>Submit</Button>
    </>;
  }

  submit = () => {
    const {osmImageNote, refreshNote} = this.props;
    const commentEl = document.getElementById('new-comment') as HTMLTextAreaElement;
    const data = {image_note: osmImageNote.id, comment: commentEl.value};
    sessionRequest(osmImageNoteCommentsUrl, {method: 'POST', data}).then(response => {
      if (response.status >= 400) this.setState({error: true});
      else {
        commentEl.value = '';
        refreshNote();
      }
    })
  }
}
