import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "components/MapWidget";
import Contacts from "util_components/Contacts";
import {formatTimestamp} from "utils";
import {Package, User} from "components/types";
import Icon from "util_components/Icon";
import {markerIcons as icons} from "settings.json";

export default class DeliveredOutgoingPackage extends React.Component<{package: Package}> {
  render() {
    const {pickup_at, deliver_to, recipient, courier, picked_up_time, delivered_time} = this.props.package;
    const courier_ = courier as User;

    return (
      <Card title={
            <>
              <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={-1} />
              To {recipient}
            </>}
          subtitles={[deliver_to.street_address]}>
        <Contacts
          title="Courier"
          name={`${courier_.first_name} ${courier_.last_name}`}
          phone={[]} />
        <CardP>
          <Icon icon={icons.origin}/> Picked up at {formatTimestamp(picked_up_time)}<br/>
          <Icon icon={icons.destination}/> Delivered at {formatTimestamp(delivered_time)}
        </CardP>
      </Card>
    );
  }
}
