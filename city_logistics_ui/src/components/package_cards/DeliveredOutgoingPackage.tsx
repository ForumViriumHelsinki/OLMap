import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "util_components/MapWidget";
import Contacts from "util_components/Contacts";
import {formatTimestamp} from "utils";
import {Package, User} from "components/types";

export default class DeliveredOutgoingPackage extends React.Component<{package: Package}> {
  render() {
    const {created_at, pickup_at, deliver_to, recipient, courier, picked_up_time, delivered_time} = this.props.package;
    const courier_ = courier as User;

    return (
      <Card title={
            <>
              <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={-1} />
              To {recipient}
            </>}
          subtitles={[deliver_to.street_address, formatTimestamp(created_at)]}>
        <Contacts
          title="Courier"
          name={`${courier_.first_name} ${courier_.last_name}`}
          phone={[]} />
        <CardP>Picked up at {formatTimestamp(picked_up_time)}</CardP>
        <CardP>Delivered at {formatTimestamp(delivered_time)}</CardP>
      </Card>
    );
  }
}
