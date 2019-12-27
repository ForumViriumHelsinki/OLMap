import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "util_components/MapWidget";
import Contacts from "util_components/Contacts";
import {formatTimestamp} from "utils";
import PackageDistances from "components/PackageDistances";
import {Package} from "components/types";

export default class PendingOutgoingPackage extends React.Component<{package: Package}> {
  render() {
    const {
      created_at, pickup_at, deliver_to, recipient, courier,
      picked_up_time, delivered_time, courier_location} = this.props.package;
    const currentPositionIndex = !courier_location ? -1 : picked_up_time ? 1 : 0;

    const title = <>
        <MapWidget origin={pickup_at} destination={deliver_to}
                   currentPositionIndex={currentPositionIndex} currentPosition={courier_location}/>
        To {recipient}
      </>;

    return (
      <Card title={title} subtitles={[deliver_to.street_address, formatTimestamp(created_at)]}>
        {courier ?
          <>
            {courier_location &&
              <PackageDistances courierLocation={courier_location} package={this.props.package}/>
            }
            <Contacts
              title="Courier"
              name={`${courier.first_name} ${courier.last_name}`}
              phone={courier.phone_numbers}/>
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
      </Card>
    );
  }
}
