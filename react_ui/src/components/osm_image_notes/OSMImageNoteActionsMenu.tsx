import React from 'react';
import Icon from 'util_components/bootstrap/Icon';
import { OSMImageNote } from 'components/types';
import OSMImageNoteReviewActions from 'components/osm_image_notes/OSMImageNoteReviewActions';
import sessionRequest from 'sessionRequest';
import { osmImageNoteUrl } from 'urls';

type OSMImageNoteActionsMenuProps = {
  note: OSMImageNote;
  showOnMap?: () => any;
  adjustPosition?: () => any;
  closeNote: () => any;
  canEdit: boolean;
  refreshNote: () => any;
};

type OSMImageNoteActionsMenuState = {
  show: boolean;
};

const initialState: OSMImageNoteActionsMenuState = {
  show: false,
};

export default class OSMImageNoteActionsMenu extends React.Component<
  OSMImageNoteActionsMenuProps,
  OSMImageNoteActionsMenuState
> {
  state = initialState;

  render() {
    const { showOnMap, note, adjustPosition, closeNote, canEdit } = this.props;
    const { lon, lat } = note;

    const { show } = this.state;
    const showCls = show ? ' show' : '';

    const noteUrl = `https://app.olmap.org/#/Notes/@${lat},${lon},20`;
    const googleUrl = `https://maps.google.com/?layer=c&cbll=${note?.lat},${note.lon}`;
    const mapillaryUrl = `https://www.mapillary.com/app/?lat=${note?.lat}&lng=${note.lon}&z=20&panos=true`;
    const osmUrl = `https://www.openstreetmap.org/edit#map=20/${lat}/${lon}`;

    const hel3dLayers = `layerToActivate=%5B%22Mesh%20(2017)%22%5D`;
    const hel3dPosition = `cameraPosition=${lon}%2C${
      Number(lat) - 0.0001
    }%2C140&groundPosition=${lon}%2C${lat}`;
    const hel3dUrl = `https://kartta.hel.fi/3d/?startingmap=Cesium%20Map&lang=en&${hel3dLayers}&${hel3dPosition}/`;

    return (
      <div className={'dropdown d-inline-block' + showCls}>
        <button className="btn btn-light p-1" onClick={() => this.setState({ show: !show })}>
          <Icon icon="menu"></Icon>
        </button>
        <div className={'dropdown-menu' + showCls}>
          <button className="dropdown-item" onClick={this.copyPermalink}>
            <Icon icon="link" /> Copy link to this note
          </button>
          {adjustPosition && (
            <button className="dropdown-item" onClick={adjustPosition}>
              <Icon icon="open_with" /> Move note
            </button>
          )}

          <input
            name="image"
            id="image_note_image"
            className="d-none"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={this.onImageCaptured}
          />

          {canEdit && (
            <button className="dropdown-item" onClick={this.onImageClick}>
              <Icon icon="camera_alt" /> {note.image ? 'Update picture' : 'Add picture'}
            </button>
          )}

          <h6 className="dropdown-header">Show position in:</h6>
          {showOnMap ? (
            <button className="dropdown-item" onClick={showOnMap}>
              OLMap
            </button>
          ) : (
            <a className="dropdown-item" href={noteUrl} target="_blank">
              OLMap
            </a>
          )}
          <a className="dropdown-item" target="hel3d" href={hel3dUrl}>
            Helsinki 3D
          </a>
          <a className="dropdown-item" target="google-maps" href={googleUrl}>
            Google Street View
          </a>
          <a className="dropdown-item" target="mapillary" href={mapillaryUrl}>
            Mapillary
          </a>
          <a className="dropdown-item" target="_osm_editor" href={osmUrl}>
            OpenStreetMap
          </a>

          <OSMImageNoteReviewActions imageNote={note} onReviewed={closeNote} />
        </div>
        <textarea
          id="permalink"
          value={window.location.href}
          style={{ width: 0, height: 0, opacity: 0 }}
          readOnly
        />
      </div>
    );
  }

  copyPermalink = () => {
    (document.getElementById('permalink') as HTMLInputElement).select();
    document.execCommand('copy');
  };

  private imageEl() {
    return document.getElementById('image_note_image') as HTMLInputElement;
  }

  onImageClick = () => {
    this.imageEl().click();
  };

  onImageCaptured = () => {
    const { note, refreshNote } = this.props;
    const files = this.imageEl().files as FileList;
    const image = files[0];
    let formData = new FormData();
    formData.append('image', image);
    sessionRequest(osmImageNoteUrl(note.id as number), {
      method: 'PATCH',
      body: formData,
    }).then((response: any) => {
      if (response.status < 300) {
        refreshNote();
        this.setState({ show: false });
      }
    });
  };
}
