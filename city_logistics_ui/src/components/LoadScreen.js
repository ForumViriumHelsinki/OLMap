import React from "react";

export default class LoadScreen extends React.Component {
  render() {
    return <div className="container">
      <div className="jumbotron mt-5 bg-light shadow text-center">
        <img className="w-50" src="images/FORUM_VIRIUM_logo_orange.png"/>
        <h3>FVH City Logistics</h3>
        <p className="lead text-primary mt-3">To confidently go where many a delivery man has gotten lost
          before.</p>
        <div className="align-content-center">
          <div className="spinner-border text-secondary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    </div>;
  }
}
