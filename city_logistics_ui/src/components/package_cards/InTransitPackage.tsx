import React from 'react';
import Card, {CardP} from "util_components/Card";
import MapWidget from "components/MapWidget";
import Contacts from "util_components/Contacts";
import {formatTimestamp} from "utils";
import PackageDistances from "components/PackageDistances";
import ConfirmButton from "util_components/ConfirmButton";
import {Package, packageAction, User} from "components/types";
import {LocationTuple} from "util_components/types";
import TimeInterval from "util_components/TimeInterval";
import {sessionRequest} from "sessionRequest";
import {myPackageActionUrl} from "urls";
import CopyTsvWidget from "util_components/CopyTsvWidget";
import {packageAsTsv} from "components/package_cards/packageUtils";

type InTransitPackageProps = {
    package: Package,
    currentLocation?: LocationTuple,
    onPackageUpdate: (item: Package) => any
}

type State = { error: boolean };

export default class InTransitPackage extends React.Component<InTransitPackageProps, State> {
  state: State = {error: false};

  render() {
    const {
      earliest_pickup_time, latest_pickup_time,
      earliest_delivery_time, latest_delivery_time,
      pickup_at, deliver_to, weight, width, height, depth, name, delivery_instructions,
      picked_up_time, recipient, recipient_phone, sender, id} = this.props.package;

    const {currentLocation} = this.props;
    const [lon, lat] = currentLocation || [];

    const currentPositionIndex = picked_up_time ? 1 : 0;

    const title = <>
        <MapWidget origin={pickup_at} destination={deliver_to} currentPositionIndex={currentPositionIndex}/>
        <CopyTsvWidget values={packageAsTsv(this.props.package)} className="float-right mr-2"/>
        {pickup_at.street_address} to {deliver_to.street_address}
      </>;

    return (
      <Card title={title} subtitles={[formatTimestamp(earliest_pickup_time), name]}>

      {(weight || width || height || depth) &&
        <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>}
      <PackageDistances package={this.props.package} courierLocation={currentLocation && {lat, lon}}/>
      {picked_up_time
        ?
          <>
            <CardP>
              <TimeInterval label="Delivery" from={earliest_delivery_time} to={latest_delivery_time}/>
            </CardP>
            <Contacts phone={recipient_phone} title="Recipient" name={recipient}/>
            {delivery_instructions &&
              <CardP>{delivery_instructions}</CardP>}
            <ConfirmButton onClick={() => this.packageAction('delivery')}>Register delivery</ConfirmButton>
          </>
        : <>
            <CardP>
              <TimeInterval label="Pickup" from={earliest_pickup_time} to={latest_pickup_time}/><br />
              <TimeInterval label="Delivery" from={earliest_delivery_time} to={latest_delivery_time}/>
            </CardP>
            <Contacts phone={sender.phone_numbers} title="Sender" name={`${sender.first_name} ${sender.last_name}`}/>
            <Contacts phone={recipient_phone} title="Recipient" name={recipient}/>
            {delivery_instructions &&
              <CardP>
                <strong>Destination: {deliver_to.street_address}</strong><br/>
                {delivery_instructions}
              </CardP>}
            <ConfirmButton onClick={() => this.packageAction('pickup')}>Register pickup</ConfirmButton>
           </>
      }
      </Card>
    );
  }

  packageAction = (action: packageAction) => {
    const {onPackageUpdate} = this.props;
    const {id} = this.props.package;
    sessionRequest(myPackageActionUrl(id, action), {method: 'PUT'})
    .then((response) => {
      if (response.status == 200) response.json().then(onPackageUpdate)
      else this.setState({error: true});
    })
  };
}
