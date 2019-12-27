import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "util_components/MapWidget";
import {formatTimestamp} from "utils";
import PackageDistances from "components/PackageDistances";
import Button from "util_components/Button";
import {Package} from "components/types";
import {LocationTuple} from "util_components/types";

type AvailablePackageProps = {
    package: Package,
    currentLocation?: LocationTuple,
    onPackageReserve: (id: number) => any
}

export default class AvailablePackage extends React.Component<AvailablePackageProps> {
  render() {
    const {
      earliest_pickup_time, pickup_at, deliver_to,
      weight, width, height, depth, id} = this.props.package;

    const {currentLocation, onPackageReserve} = this.props;
    const [lat, lon] = currentLocation || [];

    const title = <>
        <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={0}/>
        {pickup_at.street_address} to {deliver_to.street_address}
      </>;

    return (
      <Card title={title} subtitles={[deliver_to.street_address, formatTimestamp(earliest_pickup_time)]}>
        <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
        <PackageDistances package={this.props.package} courierLocation={currentLocation && {lat, lon}}/>
        <Button confirm="Reserve for delivery?" onClick={() => onPackageReserve(id)}>Reserve</Button>
      </Card>
    );
  }
}
