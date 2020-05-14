import React from 'react';

import {
  availablePackagesUrl,
  myDeliveredPackagesUrl,
  myLocationUrl, myPackageActionUrl, myPackagesUrl, reservePackageUrl
} from "urls";

import {sessionRequest} from "sessionRequest";
import Geolocator from "util_components/Geolocator";
import DeliveredByMePackage from "components/package_cards/DeliveredByMePackage";
import InTransitPackage from "components/package_cards/InTransitPackage";
import {LocationTuple} from "util_components/types";
import {Package} from "components/types";
import NavPills from "util_components/bootstrap/NavPills";
import LiveList from "util_components/LiveList";
import AvailablePackage from "components/package_cards/AvailablePackage";
import LivePackagesMap from "components/LivePackagesMap";

type State = {
  activeTab: string,
  currentLocation?: LocationTuple
};

export default class ReservedPackageLists extends React.Component {
  state: State = {activeTab: 'Pending'};

  liveList = React.createRef<LiveList>();

  render() {
    const {activeTab, currentLocation} = this.state;

    const tabs = [
      {
        name: 'Pending',
        render: () => <LiveList ref={this.liveList} url={myPackagesUrl} item={(item: any) =>
            <InTransitPackage package={item}
                              currentLocation={currentLocation}
                              onPackageUpdate={this.onPackageUpdate}/>}/>
      }, {
        name: 'Available',
        render: () => <LiveList url={availablePackagesUrl} item={(item: any) =>
          <AvailablePackage key={item.id} package={item} currentLocation={currentLocation}
                            onPackageUpdate={this.onPackageUpdate}/>}/>
      }, {
        name: 'Map',
        render: () => <LivePackagesMap/>
      }, {
        name: 'Delivered',
        render: () => <LiveList url={myDeliveredPackagesUrl}
                                item={(item: any) => <DeliveredByMePackage package={item}/>}/>
      }
    ];

    const activeTabSpec = tabs.find(({name}) => name == activeTab) || tabs[0];

    return <div className="mt-2">
      <Geolocator onLocation={this.locationUpdated}/>
      <NavPills onSelect={(activeTab) => this.setState({activeTab})}
                navs={tabs.map(({name}) => name)}
                active={activeTab} disabled={[]}/>
      {activeTabSpec.render()}
    </div>;
  }

  onPackageUpdate = (item: Package) => {
    if (item.courier && this.state.activeTab == 'Available')
      this.setState({activeTab: 'Pending'});
    else if (this.liveList.current) this.liveList.current.refreshItems();
  };

  locationUpdated = (currentLocation: LocationTuple) => {
    const [lon, lat] = currentLocation;
    this.setState({currentLocation});
    sessionRequest(myLocationUrl, {method: 'PUT', data: {lat, lon}});
  };
}
