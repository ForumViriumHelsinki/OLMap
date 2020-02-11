import React from 'react';
import LiveDataLoader from "util_components/LiveDataLoader";
import CenteredSpinner from "util_components/CenteredSpinner";
import TabbedCardList from "util_components/TabbedCardList";
import {sessionRequest} from "sessionRequest";
import Geolocator from "util_components/Geolocator";
import DeliveredByMePackage from "components/package_cards/DeliveredByMePackage";
import InTransitPackage from "components/package_cards/InTransitPackage";
import Component from "util_components/Component";
import {LocationTuple} from "util_components/types";
import {Package, packageAction} from "components/types";
import {myLocationUrl, myPackageActionUrl, myPackagesUrl} from "urls";

export default class ReservedPackageLists extends Component<{}> {
  static bindMethods = ['locationUpdated', 'packageAction', 'packagesLoaded'];
  dataLoader = React.createRef<LiveDataLoader>();

  state: {currentLocation?: LocationTuple, items?: Package[]} = {
    currentLocation: undefined,
    items: undefined
  };
  locationSaveNeeded = false;

  tabs() {
    return [
      {
        name: 'Pending',
        filter: (item: Package) => !item.delivered_time,
        renderItem: (item: Package) =>
          <InTransitPackage package={item}
                            currentLocation={this.state.currentLocation}
                            onPackageAction={this.packageAction}/>
      }, {
        name: 'Delivered',
        filter: (item: Package) => item.delivered_time,
        renderItem: (item: Package) => <DeliveredByMePackage package={item}/>
      }
    ];
  }

  render() {
    const {items} = this.state;
    return <>
      <LiveDataLoader url={myPackagesUrl} onLoad={this.packagesLoaded} ref={this.dataLoader}/>
      {items ? <TabbedCardList items={items} tabs={this.tabs()}/> : <CenteredSpinner/>}
      <Geolocator onLocation={this.locationUpdated}/>
    </>;
  }

  packageAction(id: number, action: packageAction) {
    sessionRequest(myPackageActionUrl(id, action), {method: 'PUT'})
    .then((response) => {
      if ((response.status == 200) && this.dataLoader.current) this.dataLoader.current.refreshItems();
      else this.setState({error: true});
    })
  }

  // If there are undelivered but reserved packages, courier location should be saved to db:
  packagesLoaded(items: Package[]) {
    this.setState({items});
    this.locationSaveNeeded = items.filter((p) => !p.delivered_time).length > 0;
  }

  locationUpdated(currentLocation: LocationTuple) {
    this.setState({currentLocation});
    if (this.locationSaveNeeded) {
      const [lon, lat] = currentLocation;
      sessionRequest(myLocationUrl, {method: 'PUT', data: {lat, lon}});
    }
  }
}
