import React from 'react';

import {loadData} from "loadData";

import Geolocator from "util_components/Geolocator";
import LiveDataLoader from "util_components/LiveDataLoader";
import AvailablePackage from "components/package_cards/AvailablePackage";
import Component from "util_components/Component";


export default class AvailablePackages extends Component {
  url = "/rest/available_packages/";
  static bindMethods = ['reservePackage'];

  state = {
    currentLocation: null,
    packages: []
  };

  render() {
    const {packages, currentLocation} = this.state;

    return <>
      <Geolocator onLocation={(currentLocation) => this.setState({currentLocation})}/>
      <LiveDataLoader url={this.url} onLoad={(packages) => this.setState({packages})}/>
      {packages.length ?
          packages.map((item) =>
            <AvailablePackage key={item.id} package={item} currentLocation={currentLocation}
                              onPackageReserve={this.reservePackage}/>)
        : <div className="mt-2 text-muted">No available packages.</div>
      }
    </>;
  }

  reservePackage(id) {
    loadData(this.url + id + '/reserve/', {method: 'PUT'})
    .then((response) => {
      if (response.status == 200) this.props.onPackageReserved();
      else this.setState({error: true});
    })
  }
}