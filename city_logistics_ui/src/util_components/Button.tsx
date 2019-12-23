import React from "react";
import * as PropTypes from "prop-types";
import Confirm from "util_components/Confirm";

type ButtonProps = {
  onClick: () => any,
  children: any,
  confirm?: string
};

export default class Button extends React.Component<ButtonProps> {
  state = {
    showConfirmation: false
  };

  render() {
    const {onClick, children, confirm} = this.props;
    const {showConfirmation} = this.state;

    return <>
        <button className="btn btn-secondary"
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