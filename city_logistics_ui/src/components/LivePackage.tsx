import React from 'react';
import LiveDataLoader from "util_components/LiveDataLoader";
import PendingOutgoingPackage from "components/package_cards/PendingOutgoingPackage";
import CenteredSpinner from "util_components/bootstrap/CenteredSpinner";
import NavBar from "util_components/bootstrap/NavBar";
import {Package} from "components/types";
import {uuidPackageUrl} from "urls";
import Terms from "components/Terms";

export default class LivePackage extends React.Component<{uuid: string}> {
  state: {pkg?: Package} = {
    pkg: undefined
  };

  render() {
    const {uuid} = this.props;
    const {pkg} = this.state;

    return <>
      <NavBar icon="work" iconText="">
        <h5 className="mt-1">Package</h5>
      </NavBar>
      <div className="container mt-2">
        <LiveDataLoader url={uuidPackageUrl(uuid)} onLoad={(pkg) => this.setState({pkg})}/>
        {pkg ? <PendingOutgoingPackage package={pkg}/> : <CenteredSpinner/>}
        <p className="mt-4">
          Courier or sender?
          <a className="btn btn-outline-primary btn-block mt-2 mb-2" href="/">Sign in</a>
          to register changes to packages
        </p>
        <Terms/>
      </div>
    </>;
  }
}
