import React from 'react';
import { MapFeature } from 'components/workplace_wizard/types';
import ReactDOM from 'react-dom';
import Modal from 'util_components/bootstrap/Modal';
import ZoomableImage from 'util_components/ZoomableImage';
import sessionRequest from 'sessionRequest';
import { osmImageNoteUrl } from 'urls';
import { popupBtn, WWIcon } from 'components/workplace_wizard/util_components';

type ImageButtonProps = { f: MapFeature; editor?: any };

export class ImageButton extends React.Component<ImageButtonProps, { visible: boolean }> {
  state = { visible: false };
  formData?: FormData;
  saving?: boolean;

  render() {
    const { f, editor } = this.props;
    const { visible } = this.state;
    return (
      <>
        {f.image && (
          <button className={popupBtn} onClick={() => this.setState({ visible: true })}>
            <WWIcon icon="photo_camera" outline /> Näytä kuva
          </button>
        )}
        {editor && (
          <>
            <button className={popupBtn} onClick={this.onImageClick}>
              <WWIcon icon="add_a_photo" outline /> {f.image ? 'Vaihda' : 'Lisää'} kuva
            </button>
            <input
              name="image"
              id="image_btn_image"
              className="d-none"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={this.onImageCaptured}
            />
          </>
        )}
        {f.image &&
          visible &&
          ReactDOM.createPortal(
            <Modal onClose={() => this.setState({ visible: false })} title="Kuva">
              <ZoomableImage src={f.image} className="wwModalImg" />
            </Modal>,
            document.body,
          )}
      </>
    );
  }

  private imageEl() {
    return document.getElementById('image_btn_image') as HTMLInputElement;
  }

  onImageClick = () => {
    this.imageEl().click();
  };

  onImageCaptured = () => {
    const { f, editor } = this.props;
    const files = this.imageEl().files as FileList;
    const image = files[0];

    this.formData = new FormData();
    this.formData.append('image', image);

    if (f.image_note_id) this.saveImage(f);
    else editor.save().then(() => this.saveImage(f));
  };

  saveImage(f: MapFeature) {
    sessionRequest(osmImageNoteUrl(f.image_note_id as number), {
      method: 'PATCH',
      body: this.formData,
    }).then((response: any) => {
      if (response.status < 300) {
        response.json().then(({ image }: any) => {
          f.image = image;
          this.formData = undefined;
          this.props.editor.closePopup();
          this.props.editor.forceUpdate();
        });
      }
    });
  }
}
