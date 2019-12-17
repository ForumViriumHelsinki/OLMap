import React from 'react';
import Card, {CardP} from "components/Card";
import MapWidget from "components/MapWidget";
import Contacts from "components/Contacts";
import {formatTimestamp} from "utils";
import PackageDistances from "components/PackageDistances";
import Button from "components/Button";

export default class InTransitPackage extends React.Component {
  render() {
    const {
      earliest_pickup_time, pickup_at, deliver_to, weight, width, height, depth,
      picked_up_time, recipient, recipient_phone, sender, id} = this.props.package;

    const {currentLocation, onPackageAction} = this.props;
    const [lat, lon] = currentLocation || [];

    const currentPositionIndex = picked_up_time ? 1 : 0;

    const title = <>
        <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={currentPositionIndex}/>
        {pickup_at.street_address} to {deliver_to.street_address}
      </>;

    return (
      <Card title={title} subtitles={[formatTimestamp(earliest_pickup_time)]}>
      <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
      <PackageDistances package={this.props.package} courierLocation={currentLocation && {lat, lon}}/>
      {picked_up_time
        ?
          <>
            <Contacts phone={recipient_phone} title="Recipient" name={recipient}/>
            <Button onClick={() => onPackageAction(id, 'delivery')}>Register delivery</Button>
          </>
        : <>
            <Contacts phone={sender.phone_numbers} title="Sender" name={`${sender.first_name} ${sender.last_name}`}/>
            <Button onClick={() => onPackageAction(id, 'pickup')}>Register pickup</Button>
          </>
      }
      </Card>
    );
  }
}
