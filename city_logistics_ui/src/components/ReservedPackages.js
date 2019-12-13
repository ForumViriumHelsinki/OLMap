import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {loadData} from "../loadData";
import Button from "./Button";
import {formatTimestamp} from "../utils";
import MapWidget from "./MapWidget";
import Contacts from "./Contacts";
import settings from '../settings';
import Distances from "./Distances";
import Geolocator from "./Geolocator";


export default class ReservedPackages extends React.Component {
  url = "/rest/my_packages/";
  packageList = React.createRef();
  state = {
    currentLocation: null
  };

  render() {
    return <>
      <PackageList
        url={this.url}
        ref={this.packageList}
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
      <Geolocator onLocation={(currentLocation) => this.setState({currentLocation})}/>
    </>;
  }

  packageContent(item) {
    const {
      weight, width, height, depth,
      picked_up_time, delivered_time,
      pickup_at, deliver_to,
      recipient, recipient_phone, sender} = item;

    const [lat, lon] = this.state.currentLocation || [];

    const currentLocation = this.state.currentLocation && {
      name: 'current location', location: {lat, lon}, icon: settings.markerIcons.currentPosition
    };

    const points=[
      {name: 'pickup at', location: pickup_at, icon: settings.markerIcons.origin},
      {name: 'deliver to', location: deliver_to, icon: settings.markerIcons.destination}
    ];

    if (currentLocation) {
      if (picked_up_time) {
        if (!delivered_time) {
          points.splice(1, 0, currentLocation);
        }
      } else points.splice(0, 0, currentLocation);
    }

    return <>
      <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
      <Distances {...{points}} />
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
}
