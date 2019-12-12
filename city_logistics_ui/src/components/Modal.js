import React from 'react';

export class ModalBody extends React.Component {
  render() {
    return <div className="modal-body">{this.props.children}</div>;
  }
}

export class ModalActions extends React.Component {
  render() {
    return <div className="modal-footer">
      {this.props.actions.map(({label, action, color}) =>
        <button key={label} type="button" className={"btn btn-" + color} onClick={action}>{label}</button>
      )}
    </div>;
  }
}

export default class Modal extends React.Component {
  render() {
    const {title, onClose, children} = this.props;
    return (<>
      <div className="modal-backdrop show"> </div>
      <div className="modal show" tabIndex="-1" role="dialog" style={{display: 'block'}}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">{title}</h6>
              {onClose &&
              <button type="button" className="close" aria-label="Close" onClick={onClose}>
                <span aria-hidden="true">&times;</span>
              </button>
              }
            </div>
            {children}
          </div>
        </div>
      </div>
    </>);
  }
}
