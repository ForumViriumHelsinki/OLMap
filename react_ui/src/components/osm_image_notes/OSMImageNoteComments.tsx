import React from 'react';
// @ts-ignore
import {Button} from 'reactstrap';
import {AppContext, OSMImageNote} from "components/types";
import {formatTimestamp} from "utils";
import sessionRequest from "sessionRequest";
import {osmImageNoteCommentsUrl, osmImageNoteCommentUrl} from "urls";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";
import Icon from "util_components/bootstrap/Icon";
import Confirm from "util_components/bootstrap/Confirm";

type OSMImageNoteCommentsProps = {
  osmImageNote: OSMImageNote,
  refreshNote: () => any
}

type OSMImageNoteCommentsState = {
  error: boolean,
  confirmDelete?: number
}

const initialState: OSMImageNoteCommentsState = {
  error: false
};

export default class OSMImageNoteComments extends React.Component<OSMImageNoteCommentsProps> {
  state = initialState;
  static contextType = AppContext;

  render() {
    const {osmImageNote} = this.props;
    const {error, confirmDelete} = this.state;
    const {user} = this.context;
    const comments = osmImageNote.comments || [];

    return <>
      {comments.map(comment =>
        <div key={comment.id} className="mb-2 mt-2">
          <strong>{comment.user || 'Anonymous'} {formatTimestamp(comment.created_at)}:</strong>
          {user.is_reviewer &&
            <button className="btn btn-light btn-compact btn-discrete p-0 ml-1"
                    onClick={() => this.setState({confirmDelete: comment.id})}>
              <Icon icon="delete_outline"/>
            </button>
          }
          <br/>
          {comment.comment}
        </div>
      )}
      <ErrorAlert message="Commenting failed. Try again maybe?" status={error}/>
      <textarea className="form-control" placeholder="Write your comment here" id="new-comment"/>
      <Button className="btn-block" color="primary" onClick={this.submit}>Submit</Button>
      {confirmDelete &&
        <Confirm title="Delete comment?" onConfirm={this.onDelete}
                 onClose={() => this.setState({confirmDelete: undefined})}/>
      }
    </>;
  }

  submit = () => {
    const {osmImageNote, refreshNote} = this.props;
    const commentEl = document.getElementById('new-comment') as HTMLTextAreaElement;
    const data = {image_note: osmImageNote.id, comment: commentEl.value};
    sessionRequest(osmImageNoteCommentsUrl, {method: 'POST', data}).then(response => {
      if (response.status >= 400) this.setState({error: true});
      else {
        this.setState({error: false});
        commentEl.value = '';
        refreshNote();
      }
    })
  };

  onDelete = () => {
    const {confirmDelete} = this.state;
    const {refreshNote} = this.props;
    if (!confirmDelete) return;

    sessionRequest(osmImageNoteCommentUrl(confirmDelete), {method: 'DELETE'}).then(response => {
      if (response.status >= 400) this.setState({error: true});
      else {
        this.setState({error: false});
        refreshNote();
      }
    })
  };
}
