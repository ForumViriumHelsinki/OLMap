import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "util_components/MapWidget";
import Contacts from "util_components/Contacts";
import {formatTimestamp} from "utils";
import PackageDistances from "components/PackageDistances";

export default class DeliveredByMePackage extends React.Component {
  render() {
    const {pickup_at, deliver_to, weight, width, height, depth, picked_up_time, delivered_time} = this.props.package;

    const title = <>
      <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={-1}/>
      {pickup_at.street_address} to {deliver_to.street_address}
    </>;

    return (
      <Card title={title} subtitles={[formatTimestamp(delivered_time)]}>
        <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
        <PackageDistances package={this.props.package}/>
        <CardP>Picked up at {formatTimestamp(picked_up_time)}</CardP>
        <CardP>Delivered at {formatTimestamp(delivered_time)}</CardP>
      </Card>
    );
  }
}
