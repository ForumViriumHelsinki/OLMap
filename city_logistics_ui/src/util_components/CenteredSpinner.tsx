import React from "react";

export default class CenteredSpinner extends React.Component {
  render() {
    return <div className="align-content-center">
      <div className="spinner-border text-secondary" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>;
  }
}