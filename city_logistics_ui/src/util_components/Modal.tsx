import React from 'react';

export class ModalBody extends React.Component {
  render() {
    return <div className="modal-body">{this.props.children}</div>;
  }
}

type Action = {
  label: string,
  action: () => any,
  color: 'primary' | 'secondary' | 'light' | 'outline-primary' | 'outline-secondary'
}

export class ModalActions extends React.Component<{actions: Action[]}> {
  render() {
    return <div className="modal-footer">
      {this.props.actions.map(({label, action, color}) =>
        <button key={label} type="button" className={"btn btn-" + color} onClick={action}>{label}</button>
      )}
    </div>;
  }
}

type ModalProps = {title: string, onClose: () => any, children: any}

export default class Modal extends React.Component<ModalProps> {
  render() {
    const {title, onClose, children} = this.props;
    return (<>
      <div className="modal-backdrop show"> </div>
      <div className="modal show" tabIndex={-1} role="dialog" style={{display: 'block'}} onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered"
             role="document"
             onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            {title &&
              <div className="modal-header">
                <h6 className="modal-title">{title}</h6>
                {onClose &&
                <button type="button" className="close" aria-label="Close" onClick={onClose}>
                  <span aria-hidden="true">&times;</span>
                </button>
                }
              </div>
            }
            {children}
          </div>
        </div>
      </div>
    </>);
  }
}
