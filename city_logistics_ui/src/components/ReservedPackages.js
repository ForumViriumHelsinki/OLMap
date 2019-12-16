import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {loadData} from "../loadData";
import Button from "./Button";
import {formatTimestamp} from "../utils";
import MapWidget from "./MapWidget";
import Contacts from "./Contacts";
import Geolocator from "./Geolocator";
import PackageDistances from "./PackageDistances";


export default class ReservedPackages extends React.Component {
  url = "/rest/my_packages/";
  locationUrl = "/rest/my_location/";

  packageList = React.createRef();
  state = {
    currentLocation: null
  };
  locationSaveNeeded = false;

  constructor() {
    super(...arguments);
    this.updateLocationSaveNeeded = this.updateLocationSaveNeeded.bind(this);
    this.locationUpdated = this.locationUpdated.bind(this);
  }

  render() {
    return <>
      <PackageList
        url={this.url}
        ref={this.packageList}
        onPackagesLoaded={this.updateLocationSaveNeeded}
        packageTitle={(item) =>
          <>
            <MapWidget
              origin={item.pickup_at}
              destination={item.deliver_to}
              currentPositionIndex={item.delivered_time ? -1 : item.picked_up_time ? 1 : 0}/>
            {item.pickup_at.street_address} to {item.deliver_to.street_address}
          </>}
        packageSubtitles={(item) => [formatTimestamp(item.earliest_pickup_time)]}
        packageContent={(item) => this.packageContent(item)} />
      <Geolocator onLocation={this.locationUpdated}/>
    </>;
  }

  packageContent(item) {
    const {
      weight, width, height, depth,
      picked_up_time, delivered_time,
      recipient, recipient_phone, sender} = item;
    const {currentLocation} = this.state;
    const [lat, lon] = currentLocation || [];

    return <>
      <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
      <PackageDistances package={item} courierLocation={currentLocation && {lat, lon}}/>
      {picked_up_time
        ?
          delivered_time
            ? <CardP>Delivered {formatTimestamp(delivered_time)}</CardP>
            : <>
                <Contacts phone={recipient_phone} title="Recipient" name={recipient}/>
                <Button onClick={() => this.packageAction(item.id, 'delivery')}>Register delivery</Button>
              </>
        : <>
            <Contacts phone={sender.phone_numbers} title="Sender" name={`${sender.first_name} ${sender.last_name}`}/>
            <Button onClick={() => this.packageAction(item.id, 'pickup')}>Register pickup</Button>
          </>
      }
    </>;
  }

  packageAction(id, action) {
    loadData(this.url + id + `/register_${action}/`, {method: 'PUT'})
    .then((response) => {
      if (response.status == 200) this.packageList.current.refreshPackages();
      else this.setState({error: true});
    })
  }

  // If there are undelivered but reserved packages, courier location should be saved to db:
  updateLocationSaveNeeded(packages) {
    this.locationSaveNeeded = packages.filter((p) => !p.delivered_time).length > 0;
  }

  locationUpdated(currentLocation) {
    this.setState({currentLocation});
    if (this.locationSaveNeeded) {
      const [lat, lon] = currentLocation;
      loadData(this.locationUrl, {method: 'PUT', data: {lat, lon}});
    }
  }
}
