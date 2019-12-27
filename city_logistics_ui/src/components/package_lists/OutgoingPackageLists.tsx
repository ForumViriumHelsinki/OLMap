import React from 'react';
import LiveDataLoader from "util_components/LiveDataLoader";
import Spinner from "util_components/Spinner";
import TabbedCardList from "util_components/TabbedCardList";
import PendingOutgoingPackage from "components/package_cards/PendingOutgoingPackage";
import DeliveredOutgoingPackage from "components/package_cards/DeliveredOutgoingPackage";
import {Package} from "components/types";

export default class OutgoingPackageLists extends React.Component {
  url="/rest/outgoing_packages/";

  state: {items?: Package[]} = {items: undefined};

  tabs = [
    {
      name: 'Pending',
      filter: (item: Package) => !item.delivered_time,
      renderItem: (item: Package) => <PendingOutgoingPackage package={item}/>
    }, {
      name: 'Delivered',
      filter: (item: Package) => item.delivered_time,
      renderItem: (item: Package) => <DeliveredOutgoingPackage package={item}/>
    }
  ]

  render() {
    const {items} = this.state;
    return <>
      <LiveDataLoader url={this.url} onLoad={(items) => this.setState({items})}/>
      {items ? <TabbedCardList items={items} tabs={this.tabs}/> : <Spinner/>}
    </>;
  }
}
