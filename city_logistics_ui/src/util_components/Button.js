import React from "react";
import * as PropTypes from "prop-types";
import Confirm from "util_components/Confirm";


export default class Button extends React.Component {
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

Button.propTypes = {onClick: PropTypes.func};