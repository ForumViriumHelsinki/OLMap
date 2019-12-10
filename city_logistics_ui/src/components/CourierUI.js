import React from 'react';
import FVHTabsUI from "./FVHTabsUI";
import ReservedPackages from "./ReservedPackages";
import AvailablePackages from "./AvailablePackages";


export default class CourierUI extends FVHTabsUI {
  tabs = {
    myPackages: {
      header: 'My packages',
      ChildComponent: ReservedPackages,
      icon: 'directions_bike',
      menuText: 'Packages'
    },
    availablePackage: {
      header: 'Available',
      ChildComponent: AvailablePackages,
      icon: 'dynamic_feed',
      menuText: 'Available'
    },
  };

  state = {
    activeTab: 'myPackages'
  };
}