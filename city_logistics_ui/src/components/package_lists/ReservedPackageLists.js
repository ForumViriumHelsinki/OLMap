import React from 'react';
import LiveDataLoader from "util_components/LiveDataLoader";
import Spinner from "util_components/Spinner";
import TabbedCardList from "util_components/TabbedCardList";
import {loadData} from "loadData";
import Geolocator from "util_components/Geolocator";
import DeliveredByMePackage from "components/package_cards/DeliveredByMePackage";
import InTransitPackage from "components/package_cards/InTransitPackage";
import Component from "util_components/Component";

export default class ReservedPackageLists extends Component {
  url = "/rest/my_packages/";
  locationUrl = "/rest/my_location/";
  static bindMethods = ['locationUpdated', 'packageAction', 'packagesLoaded'];
  dataLoader = React.createRef();

  state = {
    currentLocation: null,
    items: null
  };
  locationSaveNeeded = false;

  tabs() {
    return [
      {
        name: 'Pending',
        filter: (item) => !item.delivered_time,
        renderItem: (item) =>
          <InTransitPackage package={item}
                            currentLocation={this.state.currentLocation}
                            onPackageAction={this.packageAction}/>
      }, {
        name: 'Delivered',
        filter: (item) => item.delivered_time,
        renderItem: (item) => <DeliveredByMePackage package={item}/>
      }
    ];
  }

  render() {
    const {items} = this.state;
    return <>
      <LiveDataLoader url={this.url} onLoad={this.packagesLoaded} ref={this.dataLoader}/>
      {items ? <TabbedCardList items={items} tabs={this.tabs()}/> : <Spinner/>}
      <Geolocator onLocation={this.locationUpdated}/>
    </>;
  }

  packageAction(id, action) {
    loadData(this.url + id + `/register_${action}/`, {method: 'PUT'})
    .then((response) => {
      if (response.status == 200) this.dataLoader.current.refreshItems();
      else this.setState({error: true});
    })
  }

  // If there are undelivered but reserved packages, courier location should be saved to db:
  packagesLoaded(items) {
    this.setState({items});
    this.locationSaveNeeded = items.filter((p) => !p.delivered_time).length > 0;
  }

  locationUpdated(currentLocation) {
    this.setState({currentLocation});
    if (this.locationSaveNeeded) {
      const [lat, lon] = currentLocation;
      loadData(this.locationUrl, {method: 'PUT', data: {lat, lon}});
    }
  }
}
