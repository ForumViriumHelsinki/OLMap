import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {formatTimestamp} from "../utils";
import Contacts from "./Contacts";


export default class OutgoingPackages extends React.Component {
  render() {
    return <PackageList
      url="/rest/outgoing_packages/"
      packageTitle={(item) => `To ${item.recipient}`}
      packageSubtitles={(item) => [item.deliver_to.street_address, formatTimestamp(item.created_at)]}
      packageContent={(item) => this.packageContent(item)} />;
  }

  packageContent(item) {
    const {courier, picked_up_time, delivered_time} = item;

    return courier
      ? <>
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
}
