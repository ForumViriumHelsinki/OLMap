import React from "react";

export default class Error extends React.Component {
  render() {
    const {status, message} = this.props;
    return status ? <div className="alert alert-danger" role="alert">{message}</div> : '';
  }
}