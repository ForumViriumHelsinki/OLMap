import React from "react";
import Confirm from "util_components/Confirm";

type ButtonProps = {
  onClick: () => any,
  children: any,
  confirm?: string,
  className: string
};

export default class ConfirmButton extends React.Component<ButtonProps> {
  state = {
    showConfirmation: false
  };

  static defaultProps = {className: 'btn-secondary'};

  render() {
    const {onClick, children, confirm, className} = this.props;
    const {showConfirmation} = this.state;

    return <>
        <button className={`btn ${className}`}
                onClick={(e) => {
                  e.preventDefault();
                  this.setState({showConfirmation: true})
                }}>
        {children}
      </button>
      {showConfirmation &&
        <Confirm title={confirm || (children + '?')}
                 onClose={() => this.setState({showConfirmation: false})}
                 onConfirm={onClick}/>
      }
    </>;
  }
}