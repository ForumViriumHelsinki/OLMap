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
import {packageAction} from "components/types";
import NavPills from "util_components/NavPills";
import LiveList from "util_components/LiveList";
import AvailablePackage from "components/package_cards/AvailablePackage";

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
                              onPackageAction={this.packageAction}/>}/>
      }, {
        name: 'Available',
        render: () => <LiveList url={availablePackagesUrl} item={(item: any) =>
          <AvailablePackage key={item.id} package={item} currentLocation={currentLocation}
                            onPackageReserve={this.reservePackage}/>}/>
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

  packageAction = (id: number, action: packageAction) => {
    sessionRequest(myPackageActionUrl(id, action), {method: 'PUT'})
    .then((response) => {
      if ((response.status == 200) && this.liveList.current) this.liveList.current.refreshItems();
      else this.setState({error: true});
    })
  };

  reservePackage = (id: number) => {
    sessionRequest(reservePackageUrl(id), {method: 'PUT'})
    .then((response) => {
      if (response.status == 200) this.setState({activeTab: 'Pending'});
      else this.setState({error: true});
    })
  };

  locationUpdated = (currentLocation: LocationTuple) => {
    const [lon, lat] = currentLocation;
    this.setState({currentLocation});
    sessionRequest(myLocationUrl, {method: 'PUT', data: {lat, lon}});
  };
}
