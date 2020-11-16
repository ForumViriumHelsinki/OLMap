import React from 'react';
// @ts-ignore
import {HashRouter as Router, Route, Switch, useParams, Redirect, useHistory} from "react-router-dom";

import sessionRequest, {logout} from "sessionRequest";

import LoginScreen from 'components/LoginScreen';
import LoadScreen from "components/LoadScreen";
import LivePackage from "components/LivePackage";
import {AppContext, User} from "components/types";
import ResetPasswordScreen from "components/ResetPasswordScreen";
import FVHTabsUI from "util_components/FVHTabsUI";
import OutgoingPackageLists from "components/package_lists/OutgoingPackageLists";
import OSMImageNotesEditor from "components/osm_image_notes/OSMImageNotesEditor";
import ReservedPackageLists from "components/package_lists/ReservedPackageLists";
import OSMImageNoteModal from "components/osm_image_notes/OSMImageNoteModal";

type UIState = {
  user?: User,
  dataFetched: boolean
}

class CityLogisticsUI extends React.Component<{}, UIState> {
  state: UIState = {
    user: undefined,
    dataFetched: false
  };

  tabs = {
    senderPackages: {
      header: 'Packages',
      ChildComponent: OutgoingPackageLists,
      icon: 'dynamic_feed',
      menuText: 'Packages'
    },
    courierPackages: {
      header: 'Packages',
      ChildComponent: ReservedPackageLists,
      icon: 'directions_bike',
      menuText: 'Packages'
    },
    notes: {
      header: 'Notes',
      ChildComponent: OSMImageNotesEditor,
      icon: 'my_location',
      menuText: 'Notes',
      fullWidth: true
    }
  };

  componentDidMount() {
    this.refreshUser();
  }

  refreshUser() {
    sessionRequest('/rest-auth/user/').then(response => {
      if (response.status == 401) this.setState({user: undefined, dataFetched: true});
      else response.json().then(user => this.setState({user, dataFetched: true}));
    })
  }

  logout = () => {
    sessionRequest('/rest-auth/logout/', {method: 'POST'}).then(response => {
      logout();
      this.setState({user: undefined});
    });
  };

  render() {
    const {user, dataFetched} = this.state;

    const Package = () => <LivePackage uuid={useParams().packageUUID}/>;
    // @ts-ignore
    const ImageNote = () => <OSMImageNoteModal note={{id: useParams().noteId}} fullScreen />;

    const ResetPassword = () => {
      const params = useParams();
      return <ResetPasswordScreen uid={params.uid} token={params.token}/>;
    };

    // @ts-ignore
    const tabs: any[] = [this.tabs.notes];
    if (user && user.is_courier) tabs.unshift(this.tabs.courierPackages);
    if (user && user.is_sender) tabs.unshift(this.tabs.senderPackages);

    const TabsUI = () => {
      const history = useHistory();
      return <FVHTabsUI user={user} tabs={tabs} onLogout={this.logout} onLogin={() => history.push('/login/')}/>
    };

    return dataFetched ? <AppContext.Provider value={{user}}>
      <Router>
        <Switch>
          <Route path='/login/'>
            {user ? <Redirect to="" /> : <LoginScreen onLogin={() => this.refreshUser()}/>}
          </Route>
          <Route path='/package/:packageUUID'>
            <Package/>
          </Route>
          <Route path='/resetPassword/:uid/:token'>
            <ResetPassword/>
          </Route>
          <Route path='/note/:noteId'>
            <ImageNote/>
          </Route>
          <Route exact path=''>
            <TabsUI/>
          </Route>
        </Switch>
      </Router>
    </AppContext.Provider> : <LoadScreen/>;
  }
}

export default CityLogisticsUI;
