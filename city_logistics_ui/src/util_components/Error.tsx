import React from "react";

export default class Error extends React.Component<{status?: boolean, message: string}> {
  render() {
    const {status, message} = this.props;
    return status ? <div className="alert alert-danger" role="alert">{message}</div> : '';
  }
}