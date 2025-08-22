import React from "react";

export default class CenteredSpinner extends React.Component {
  render() {
    return (
      <div className="text-center p-3">
        <div className="spinner-border text-secondary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
}
