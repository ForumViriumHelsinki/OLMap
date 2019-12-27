import React from 'react';
import NewPackage from "./NewPackage";
import FVHTabsUI from "util_components/FVHTabsUI";
import OutgoingPackageLists from "components/package_lists/OutgoingPackageLists";
import {User} from "components/types";

type func = () => any;

export default class SenderUI extends React.Component<{ user: User, onLogout: func }> {
  tabs = [
    {
      header: 'New package',
      ChildComponent: NewPackage,
      childProps: {onCreated: () => this.setState({activeTab: 'myPackages'})},
      icon: 'add_box',
      menuText: 'New'
    },
    {
      header: 'My packages',
      ChildComponent: OutgoingPackageLists,
      icon: 'dynamic_feed',
      menuText: 'Packages'
    }
  ];

  render() {
    return <FVHTabsUI {...this.props} activeTab='New package' tabs={this.tabs}/>
  }
}
