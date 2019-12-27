import React from 'react';
import FVHTabsUI from "util_components/FVHTabsUI";
import AvailablePackages from "components/package_lists/AvailablePackages";
import ReservedPackageLists from "components/package_lists/ReservedPackageLists";
import {User} from "components/types";

type func = () => any;

export default class CourierUI extends React.Component<{user: User, onLogout: func}> {
  tabs = [
    {
      header: 'My packages',
      ChildComponent: ReservedPackageLists,
      icon: 'directions_bike',
      menuText: 'Packages'
    },
    {
      header: 'Available',
      ChildComponent: AvailablePackages,
      childProps: {onPackageReserved: () => this.setState({activeTab: 'myPackages'})},
      icon: 'dynamic_feed',
      menuText: 'Available'
    },
  ];

  render() {
    return <FVHTabsUI {...this.props} activeTab='My packages' tabs={this.tabs}/>
  }
}