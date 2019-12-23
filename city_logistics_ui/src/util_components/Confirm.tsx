import React from "react";
import Modal, {ModalActions} from "util_components/Modal";

type ConfirmProps = {
  title: string,
  onConfirm: () => any,
  onClose: () => any
}

export default class Confirm extends React.Component<ConfirmProps> {
  render() {
    const {title, onConfirm, onClose} = this.props;

    return <Modal title={title} onClose={onClose}>
      <ModalActions actions={[
        {label: "Cancel", color: "light", action: onClose},
        {label: "OK", color: "secondary", action: () => { onClose(); onConfirm(); }}
      ]}/>
    </Modal>;
  }
}