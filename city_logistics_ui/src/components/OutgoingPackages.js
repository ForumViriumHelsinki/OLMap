import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {formatTimestamp} from "../utils";


export default class OutgoingPackages extends React.Component {
  render() {
    return <PackageList
      url="/rest/outgoing_packages/"
      packageTitle={(item) => `To ${item.recipient}`}
      packageSubtitles={(item) => [item.deliver_to.street_address, formatTimestamp(item.created_at)]}
      packageContent={(item) => this.packageContent(item)} />;
  }

  packageContent(item) {
    return item.courier
      ? <>
          <CardP>Courier: {item.courier.first_name} {item.courier.last_name}</CardP>
          {item.picked_up_time
            ? <>
              <CardP>Picked up at {formatTimestamp(item.picked_up_time)}</CardP>
              {item.delivered_time
                ? <CardP>Delivered at {formatTimestamp(item.delivered_time)}</CardP>
                : <CardP>Delivery in progress</CardP>
              }
            </>
            : <CardP>Awaiting pickup.</CardP>
          }
        </>
      : <CardP>No courier assigned.</CardP>
  }
}
