import React from 'react';
import {CardP} from "./Card";
import PackageList from "./PackageList";
import {loadData} from "../loadData";
import Button from "./Button";
import {formatTimestamp} from "../utils";
import MapWidget from "./MapWidget";


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
    return <>
      <CardP>{item.weight} kg, {item.width}*{item.height}*{item.depth}cm</CardP>
      {item.picked_up_time
        ?
          item.delivered_time
            ? <CardP>Delivered {formatTimestamp(item.delivered_time)}</CardP>
            : <Button onClick={() => this.packageAction(item.id, 'delivery')}>Register delivery</Button>
        : <Button onClick={() => this.packageAction(item.id, 'pickup')}>Register pickup</Button>
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
