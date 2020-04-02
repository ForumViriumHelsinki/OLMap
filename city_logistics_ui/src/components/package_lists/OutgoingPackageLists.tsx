import React from 'react';
import PendingOutgoingPackage from "components/package_cards/PendingOutgoingPackage";
import DeliveredOutgoingPackage from "components/package_cards/DeliveredOutgoingPackage";
import {pendingOutgoingPackagesUrl, deliveredOutgoingPackagesUrl} from "urls";
import NavPills from "util_components/NavPills";
import NewPackage from "components/NewPackage";
import LiveList from "util_components/LiveList";

export default class OutgoingPackageLists extends React.Component {
  state: {activeTab: string} = {activeTab: 'Pending'};

  render() {
    const {activeTab} = this.state;

    const tabs = [
      {
        name: 'Pending',
        render: () => <LiveList url={pendingOutgoingPackagesUrl}
                                item={(item: any) => <PendingOutgoingPackage package={item}/>}/>
      }, {
        name: 'Delivered',
        render: () => <LiveList url={deliveredOutgoingPackagesUrl}
                                item={(item: any) => <DeliveredOutgoingPackage package={item}/>}/>
      }, {
        name: 'New',
        render: () => <NewPackage onCreated={() => this.setState({activeTab: 'Pending'})}/>
      }
    ];

    const activeTabSpec = tabs.find(({name}) => name == activeTab) || tabs[0];
    return <div className="mt-2">
      <NavPills onSelect={(activeTab) => this.setState({activeTab})}
                navs={tabs.map(({name}) => name)}
                active={activeTab} disabled={[]}/>
      {activeTabSpec.render()}
    </div>;
  }
}
