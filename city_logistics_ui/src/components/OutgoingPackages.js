import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {formatTimestamp} from "../utils";
import Contacts from "./Contacts";
import PackageDistances from "./PackageDistances";
import MapWidget from "./MapWidget";


export default class OutgoingPackages extends React.Component {
  render() {
    return <PackageList
      url="/rest/outgoing_packages/"
      packageTitle={this.packageTitle}
      packageSubtitles={(item) => [item.deliver_to.street_address, formatTimestamp(item.created_at)]}
      packageContent={(item) => this.packageContent(item)} />;
  }

  packageContent(item) {
    const {courier, picked_up_time, delivered_time, courier_location} = item;

    return courier
      ? <>
          {courier_location && !delivered_time &&
            <PackageDistances courierLocation={courier_location} package={item}/>
          }
          <Contacts
            title="Courier"
            name={`${courier.first_name} ${courier.last_name}`}
            phone={delivered_time ? [] : courier.phone_numbers} />
          {picked_up_time
            ? <>
              <CardP>Picked up at {formatTimestamp(picked_up_time)}</CardP>
              {delivered_time
                ? <CardP>Delivered at {formatTimestamp(delivered_time)}</CardP>
                : <CardP>Delivery in progress</CardP>
              }
            </>
            : <CardP>Awaiting pickup.</CardP>
          }
        </>
      : <CardP>No courier assigned.</CardP>
  }

  packageTitle(item) {
    const {pickup_at, deliver_to, picked_up_time, delivered_time, courier_location, recipient} = item;
    const currentPositionIndex =  (delivered_time || !courier_location) ? -1 : picked_up_time ? 1 : 0;
    return <>
      <MapWidget origin={pickup_at} destination={deliver_to}
                 currentPositionIndex={currentPositionIndex}
                 currentPosition={courier_location}/>
      To {recipient}
    </>
  }
}
