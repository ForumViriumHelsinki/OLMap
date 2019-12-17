import React from 'react';
import LiveDataLoader from "./LiveDataLoader";
import Spinner from "./Spinner";
import TabbedCardList from "./TabbedCardList";
import PendingOutgoingPackage from "./PendingOutgoingPackage";
import DeliveredOutgoingPackage from "./DeliveredOutgoingPackage";

export default class OutgoingPackageLists extends React.Component {
  url="/rest/outgoing_packages/";

  state = {items: null};

  tabs = [
    {
      name: 'Pending',
      filter: (item) => !item.delivered_time,
      renderItem: (item) => <PendingOutgoingPackage package={item}/>
    }, {
      name: 'Delivered',
      filter: (item) => item.delivered_time,
      renderItem: (item) => <DeliveredOutgoingPackage package={item}/>
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
