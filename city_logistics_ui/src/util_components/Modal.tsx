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

type ModalProps = {
  title: string,
  onClose: () => any,
  children: any,
  className: string,
  headerContent?: any
}

export default class Modal extends React.Component<ModalProps> {
  static defaultProps = {className: ''};

  render() {
    const {title, onClose, children, className, headerContent} = this.props;
    return (<>
      <div className="modal-backdrop show"> </div>
      <div className="modal show" tabIndex={-1} role="dialog" onClick={onClose}>
        <div className={`modal-dialog ${className}`}
             role="document"
             onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            {(title || headerContent) &&
              <div className="modal-header">
                {title && <h6 className="modal-title">{title}</h6>}
                {headerContent}
                {onClose &&
                <button type="button" className="close" aria-label="Close" onClick={onClose}>
                  <span aria-hidden="true">&times;</span>
                </button>
                }
              </div>
            }
            <div style={{maxHeight: 'calc(100vh - 200px)', overflowY: 'auto'}}>{children}</div>
          </div>
        </div>
      </div>
    </>);
  }
}
