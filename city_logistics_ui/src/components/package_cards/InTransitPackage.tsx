import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "components/MapWidget";
import Contacts from "util_components/Contacts";
import {formatTimestamp} from "utils";
import PackageDistances from "components/PackageDistances";
import Button from "util_components/Button";
import {Package, packageAction, User} from "components/types";
import {LocationTuple} from "util_components/types";
import TimeInterval from "util_components/TimeInterval";

type InTransitPackageProps = {
    package: Package,
    currentLocation?: LocationTuple,
    onPackageAction: (id: number, action: packageAction) => any
}

export default class InTransitPackage extends React.Component<InTransitPackageProps> {
  render() {
    const {
      earliest_pickup_time, latest_pickup_time,
      earliest_delivery_time, latest_delivery_time,
      pickup_at, deliver_to, weight, width, height, depth,
      picked_up_time, recipient, recipient_phone, sender, id} = this.props.package;

    const {currentLocation, onPackageAction} = this.props;
    const [lon, lat] = currentLocation || [];

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
            <CardP>
              <TimeInterval label="Delivery" from={earliest_delivery_time} to={latest_delivery_time}/>
            </CardP>
            <Contacts phone={recipient_phone} title="Recipient" name={recipient}/>
            <Button onClick={() => onPackageAction(id, 'delivery')}>Register delivery</Button>
          </>
        : <>
            <CardP>
              <TimeInterval label="Pickup" from={earliest_pickup_time} to={latest_pickup_time}/><br />
              <TimeInterval label="Delivery" from={earliest_delivery_time} to={latest_delivery_time}/>
            </CardP>
            <Contacts phone={sender.phone_numbers} title="Sender" name={`${sender.first_name} ${sender.last_name}`}/>
            <Button onClick={() => onPackageAction(id, 'pickup')}>Register pickup</Button>
          </>
      }
      </Card>
    );
  }
}
