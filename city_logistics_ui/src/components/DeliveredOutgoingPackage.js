import React from 'react';
import Card, {CardP} from "components/Card";
import MapWidget from "components/MapWidget";
import Contacts from "components/Contacts";
import {formatTimestamp} from "utils";

export default class DeliveredOutgoingPackage extends React.Component {
  render() {
    const {created_at, pickup_at, deliver_to, recipient, courier, picked_up_time, delivered_time} = this.props.package;
    return (
      <Card title={
            <>
              <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={-1} />
              To {recipient}
            </>}
          subtitles={[deliver_to.street_address, formatTimestamp(created_at)]}>
        <Contacts
          title="Courier"
          name={`${courier.first_name} ${courier.last_name}`}
          phone={[]} />
        <CardP>Picked up at {formatTimestamp(picked_up_time)}</CardP>
        <CardP>Delivered at {formatTimestamp(delivered_time)}</CardP>
      </Card>
    );
  }
}
