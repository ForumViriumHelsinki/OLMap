import React from 'react';
import NewPackage from "./NewPackage";
import FVHTabsUI from "util_components/FVHTabsUI";
import OutgoingPackageLists from "components/package_lists/OutgoingPackageLists";
import {User} from "components/types";
import OSMPhotoNotes from "components/OSMPhotoNotes";

type func = () => any;

export default class SenderUI extends React.Component<{ user: User, onLogout: func }> {
  tabs = [
    {
      header: 'New package',
      ChildComponent: NewPackage,
      childProps: {onCreated: () => this.setState({activeTab: 'My packages'})},
      icon: 'add_box',
      menuText: 'New'
    },
    {
      header: 'My packages',
      ChildComponent: OutgoingPackageLists,
      icon: 'dynamic_feed',
      menuText: 'Packages'
    },
    {
      header: 'Notes',
      ChildComponent: OSMPhotoNotes,
      icon: 'my_location',
      menuText: 'Notes',
      fullWidth: true
    }
  ];

  render() {
    return <FVHTabsUI {...this.props} activeTab='New package' tabs={this.tabs}/>
  }
}
