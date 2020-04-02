import React from 'react';
import NewPackage from "./NewPackage";
import FVHTabsUI from "util_components/FVHTabsUI";
import OutgoingPackageLists from "components/package_lists/OutgoingPackageLists";
import {User} from "components/types";
import OSMImageNotesEditor from "components/osm_image_notes/OSMImageNotesEditor";

type func = () => any;

export default class SenderUI extends React.Component<{ user: User, onLogout: func }> {
  tabs = [
    {
      header: 'My packages',
      ChildComponent: OutgoingPackageLists,
      icon: 'dynamic_feed',
      menuText: 'Packages'
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
