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
