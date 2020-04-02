import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "components/MapWidget";
import {formatTimestamp} from "utils";
import PackageDistances from "components/PackageDistances";
import {Package} from "components/types";
import {markerIcons as icons} from "settings.json"
import Icon from "util_components/Icon";

export default class DeliveredByMePackage extends React.Component<{package: Package}> {
  render() {
    const {pickup_at, deliver_to, weight, width, height, depth, picked_up_time, delivered_time} = this.props.package;

    const title = <>
      <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={-1}/>
      {pickup_at.street_address} to {deliver_to.street_address}
    </>;

    return (
      <Card title={title}>
        {(weight || width || height || depth) &&
          <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>}
        <PackageDistances package={this.props.package}/>
        <CardP>
          <Icon icon={icons.origin}/> Picked up at {formatTimestamp(picked_up_time)}<br/>
          <Icon icon={icons.destination}/> Delivered at {formatTimestamp(delivered_time)}
        </CardP>
      </Card>
    );
  }
}
