import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {loadData} from "../loadData";
import Button from "./Button";
import {formatTimestamp} from "../utils";
import MapWidget from "./MapWidget";
import settings from "../settings";
import Distances from "./Distances";
import Geolocator from "./Geolocator";


export default class AvailablePackages extends React.Component {
  url = "/rest/available_packages/";
  state = {
    currentLocation: null
  };

  render() {
    return <>
      <PackageList
        url={this.url}
        packageTitle={(item) =>
          <>
            <MapWidget origin={item.pickup_at} destination={item.deliver_to}/>
            {item.pickup_at.street_address} to {item.deliver_to.street_address}
          </>}
        packageSubtitles={(item) => [(formatTimestamp(item.earliest_pickup_time))]}
        packageContent={(item) => this.packageContent(item)}
      />
      <Geolocator onLocation={(currentLocation) => this.setState({currentLocation})}/>
    </>;
  }

  packageContent(item) {
    const {
      weight, width, height, depth,
      pickup_at, deliver_to} = item;

    const [lat, lon] = this.state.currentLocation || [];

    const currentLocation = this.state.currentLocation && {
      name: 'current location', location: {lat, lon}, icon: settings.markerIcons.currentPosition
    };

    const points=[
      {name: 'pickup at', location: pickup_at, icon: settings.markerIcons.origin},
      {name: 'deliver to', location: deliver_to, icon: settings.markerIcons.destination}
    ];

    if (currentLocation) points.splice(0, 0, currentLocation);

    return <>
      <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
      <Distances {...{points}} />
      <Button confirm="Reserve for delivery?" onClick={() => this.reservePackage(item.id)}>Reserve</Button>
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
