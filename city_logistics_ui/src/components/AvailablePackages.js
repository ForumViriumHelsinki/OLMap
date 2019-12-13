import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {loadData} from "../loadData";
import Button from "./Button";
import {formatTimestamp} from "../utils";
import MapWidget from "./MapWidget";


export default class AvailablePackages extends React.Component {
  url = "/rest/available_packages/";

  render() {
    return <>
      <PackageList
        url={this.url}
        packageTitle={(item) =>
          <>
            <MapWidget origin={item.pickup_at} destination={item.deliver_to}/>
            {item.pickup_at.street_address} to {item.deliver_to.street_address}
          </>}
        packageSubtitles={(item) => [(formatTimestamp(item.earliest_pickup_time))]}
        packageContent={(item) => this.packageContent(item)}
      />
    </>;
  }

  packageContent(item) {
    return <>
      <CardP>{item.weight} kg, {item.width}*{item.height}*{item.depth}cm</CardP>
      <Button confirm="Reserve for delivery?" onClick={() => this.reservePackage(item.id)}>Reserve</Button>
    </>;
  }

  reservePackage(id) {
    loadData(this.url + id + '/reserve/', {method: 'PUT'})
    .then((response) => {
      if (response.status == 200) this.props.onPackageReserved();
      else this.setState({error: true});
    })
  }
}
