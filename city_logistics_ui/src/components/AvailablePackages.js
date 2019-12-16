import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {loadData} from "../loadData";
import Button from "./Button";
import {formatTimestamp} from "../utils";
import MapWidget from "./MapWidget";
import Geolocator from "./Geolocator";
import PackageDistances from "./PackageDistances";


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
    const {weight, width, height, depth} = item;
    const {currentLocation} = this.state;
    const [lat, lon] = currentLocation || [];

    return <>
      <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
      <PackageDistances package={item} courierLocation={currentLocation && {lat, lon}}/>
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
