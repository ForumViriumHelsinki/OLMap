import React from 'react';
import FVHTabsUI from "util_components/FVHTabsUI";
import AvailablePackages from "components/package_lists/AvailablePackages";
import ReservedPackageLists from "components/package_lists/ReservedPackageLists";
import {User} from "components/types";
import OSMImageNotesEditor from "components/osm_image_notes/OSMImageNotesEditor";

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
      childProps: {
        onPackageReserved: () =>
          this.tabsUI.current && this.tabsUI.current.switchTab('My packages')},
      icon: 'dynamic_feed',
      menuText: 'Available'
    },
    {
      header: 'Notes',
      ChildComponent: OSMImageNotesEditor,
      icon: 'my_location',
      menuText: 'Notes',
      fullWidth: true
    }
  ];

  tabsUI = React.createRef<FVHTabsUI>();

  render() {
    return <FVHTabsUI {...this.props} activeTab='My packages' tabs={this.tabs} ref={this.tabsUI}/>
  }
}