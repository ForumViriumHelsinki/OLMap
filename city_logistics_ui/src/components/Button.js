import React from "react";
import * as PropTypes from "prop-types";
import Confirm from "./Confirm";


export default class Button extends React.Component {
  state = {
    showConfirmation: false
  };

  render() {
    const {onClick, children, confirm} = this.props;
    const {showConfirmation} = this.state;

    return <>
        <a href="#" className="btn btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  this.setState({showConfirmation: true})
                }}>
        {children}
      </a>
      {showConfirmation &&
        <Confirm title={confirm || (children + '?')}
                 onClose={() => this.setState({showConfirmation: false})}
                 onConfirm={onClick}/>
      }
    </>;
  }
}

Button.propTypes = {onClick: PropTypes.func};