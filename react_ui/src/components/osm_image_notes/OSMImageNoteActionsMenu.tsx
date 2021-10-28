import React from 'react';
import Icon from "util_components/bootstrap/Icon";
import {OSMImageNote} from "components/types";
import OSMImageNoteReviewActions from "components/osm_image_notes/OSMImageNoteReviewActions";

type OSMImageNoteActionsMenuProps = {
  note: OSMImageNote,
  showOnMap?: () => any,
  adjustPosition?: () => any,
  closeNote: () => any
}

type OSMImageNoteActionsMenuState = {
  show: boolean
}

const initialState: OSMImageNoteActionsMenuState = {
  show: false
};

export default class OSMImageNoteActionsMenu extends React.Component<OSMImageNoteActionsMenuProps, OSMImageNoteActionsMenuState> {
  state = initialState;

  render() {
    const {showOnMap, note, adjustPosition, closeNote} = this.props;
    const {lon, lat} = note;

    const {show} = this.state;
    const showCls = show ? ' show' : '';

    const noteUrl = `https://app.olmap.org/#/Notes/@${lat},${lon},20`;
    const googleUrl = `https://maps.google.com/?layer=c&cbll=${note?.lat},${note.lon}`;
    const mapillaryUrl = `https://www.mapillary.com/app/?lat=${note?.lat}&lng=${note.lon}&z=20&panos=true`;
    const osmUrl = `https://www.openstreetmap.org/edit#map=20/${lat}/${lon}`;


    return <div className={"dropdown d-inline-block" + showCls}>
      <button className="btn btn-light p-1" onClick={() => this.setState({show: !show})}>
        <Icon icon="menu"></Icon>
      </button>
      <div className={"dropdown-menu" + showCls}>
        <button className="dropdown-item" onClick={this.copyPermalink}>
          <Icon icon="link"/> Copy link to this note
        </button>
        {adjustPosition &&
          <button className="dropdown-item" onClick={adjustPosition}>
            <Icon icon="open_with"/> Move note
          </button>}

        <h6 className="dropdown-header">Show position in:</h6>
        {showOnMap ?
            <button className="dropdown-item" onClick={showOnMap}>OLMap</button>
          : <a className="dropdown-item" href={noteUrl} target="_blank">OLMap</a>
        }
        <a className="dropdown-item" target="google-maps" href={googleUrl}>
          Google Street View
        </a>
        <a className="dropdown-item" target="mapillary" href={mapillaryUrl}>
          Mapillary
        </a>
        <a className="dropdown-item" target="_osm_editor" href={osmUrl}>
          OpenStreetMap
        </a>

        <OSMImageNoteReviewActions imageNote={note} onReviewed={closeNote}/>
      </div>
      <textarea id="permalink" value={window.location.href} style={{width: 0, height: 0, opacity: 0}} readOnly/>
    </div>;
  }

  copyPermalink = () => {
    (document.getElementById('permalink') as HTMLInputElement).select();
    document.execCommand('copy');
  };

}
