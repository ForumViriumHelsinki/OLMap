import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {loadData} from "../loadData";
import Button from "./Button";
import {formatTimestamp} from "../utils";
import MapWidget from "./MapWidget";
import Contacts from "./Contacts";


export default class ReservedPackages extends React.Component {
  url = "/rest/my_packages/";
  packageList = React.createRef();

  render() {
    return <PackageList
      url={this.url}
      ref={this.packageList}
      packageTitle={(item) =>
        <>
          <MapWidget
            origin={item.pickup_at}
            destination={item.deliver_to}
            currentPositionIndex={item.delivered_time ? -1 : item.picked_up_time ? 1 : 0}/>
          {item.pickup_at.street_address} to {item.deliver_to.street_address}
        </>}
      packageSubtitles={(item) => [formatTimestamp(item.earliest_pickup_time)]}
      packageContent={(item) => this.packageContent(item)} />;
  }

  packageContent(item) {
    const {weight, width, height, depth, picked_up_time, delivered_time, recipient, recipient_phone, sender} = item;

    return <>
      <CardP>{weight} kg, {width}*{height}*{depth}cm</CardP>
      {picked_up_time
        ?
          delivered_time
            ? <CardP>Delivered {formatTimestamp(delivered_time)}</CardP>
            : <>
                <Contacts phone={recipient_phone} title="Recipient" name={recipient}/>
                <Button onClick={() => this.packageAction(item.id, 'delivery')}>Register delivery</Button>
              </>
        : <>
            <Contacts phone={sender.phone_numbers} title="Sender" name={`${sender.first_name} ${sender.last_name}`}/>
            <Button onClick={() => this.packageAction(item.id, 'pickup')}>Register pickup</Button>
          </>
      }
    </>;
  }

  packageAction(id, action) {
    loadData(this.url + id + `/register_${action}/`, {method: 'PUT'})
    .then((response) => {
      if (response.status == 200) this.packageList.current.refreshPackages();
      else this.setState({error: true});
    })
  }
}
