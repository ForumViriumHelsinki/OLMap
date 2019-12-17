import React from 'react';
import NewPackage from "./NewPackage";
import FVHTabsUI from "./FVHTabsUI";
import OutgoingPackageLists from "components/OutgoingPackageLists";


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
      ChildComponent: OutgoingPackageLists,
      icon: 'dynamic_feed',
      menuText: 'Packages'
    }
  };

  state = {
    activeTab: 'newPackage'
  };
}