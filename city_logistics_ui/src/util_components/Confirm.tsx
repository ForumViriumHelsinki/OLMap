import React from "react";

// @ts-ignore
import {Input} from 'reactstrap';

import Modal, {ModalActions} from "util_components/Modal";

type ConfirmProps = {
  title: string,
  inputPlaceholder?: string,
  onConfirm: (confirmText?: string) => any,
  onClose: () => any
}

export default class Confirm extends React.Component<ConfirmProps> {
  render() {
    const {title, onConfirm, onClose, inputPlaceholder} = this.props;

    return <Modal title={title} onClose={onClose}>
      {inputPlaceholder &&
        <Input type="textarea" name="confirm" id="confirmText" placeholder={inputPlaceholder} />
      }
      <ModalActions actions={[
        {label: "Cancel", color: "light", action: onClose},
        {label: "OK", color: "secondary", action: () => this.onConfirm() }
      ]}/>
    </Modal>;
  }

  private onConfirm() {
    const {onConfirm, onClose} = this.props;
    const input = document.getElementById('confirmText') as HTMLInputElement;
    const value = input && input.value;
    onClose();
    onConfirm(value);
  }
}