import React from 'react';
import NewPackage from "./NewPackage";
import OutgoingPackages from "./OutgoingPackages";
import FVHTabsUI from "./FVHTabsUI";


export default class SenderUI extends FVHTabsUI {
  tabs = {
    newPackage: {
      header: 'New package',
      ChildComponent: NewPackage,
      childProps: {onCreated: () => this.setState({activeTab: 'myPackages'})},
      icon: 'add_box',
      menuText: 'New'
    },
    myPackages: {
      header: 'My packages',
      ChildComponent: OutgoingPackages,
      icon: 'dynamic_feed',
      menuText: 'Packages'
    }
  };

  state = {
    activeTab: 'newPackage'
  };
}