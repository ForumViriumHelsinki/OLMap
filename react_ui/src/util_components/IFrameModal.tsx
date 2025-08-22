import React from "react";
import Modal, { ModalBody } from "util_components/bootstrap/Modal";

type IFrameModalProps = {
  url: string;
  title: string;
  onClose: () => any;
};

type IFrameModalState = {};

const initialState: IFrameModalState = {};

export default class IFrameModal extends React.Component<
  IFrameModalProps,
  IFrameModalState
> {
  state = initialState;

  render() {
    const { url, onClose, title } = this.props;
    return (
      <Modal onClose={onClose} title={title} className="modal-xl">
        <iframe
          src={url}
          style={{
            width: "100%",
            height: "calc(100vh - 200px)",
            border: "none",
          }}
        />
      </Modal>
    );
  }
}
