import React from 'react';
// @ts-ignore
import {HashRouter as Router, Route, Switch, useParams} from "react-router-dom";

import sessionRequest, {logout} from "sessionRequest";

import LoginScreen from 'components/LoginScreen';
import LoadScreen from "components/LoadScreen";
import CourierUI from "components/CourierUI";
import SenderUI from "components/SenderUI";
import LivePackage from "components/LivePackage";
import {AppContext, User} from "components/types";
import OLMapUI from "components/OLMapUI";
import ResetPasswordScreen from "components/ResetPasswordScreen";

type UIState = {
  user?: User,
  dataFetched: boolean
}

class CityLogisticsUI extends React.Component<{}, UIState> {
  state: UIState = {
    user: undefined,
    dataFetched: false
  }

  constructor(props: any) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    this.refreshUser();
  }

  refreshUser() {
    sessionRequest('/rest-auth/user/').then(response => {
      if (response.status == 401) this.setState({user: undefined, dataFetched: true});
      else response.json().then(user => this.setState({user, dataFetched: true}));
    })
  }

  logout() {
    sessionRequest('/rest-auth/logout/', {method: 'POST'}).then(response => {
      logout();
      this.setState({user: undefined});
    });
  }

  render() {
    const {user, dataFetched} = this.state;
    const Package = () => <LivePackage uuid={useParams().packageUUID}/>;

    const ResetPassword = () => {
      const params = useParams();
      return <ResetPasswordScreen uid={params.uid} token={params.token}/>;
    };

    return <Router>
      <Switch>
        <Route path='/package/:packageUUID'>
          <Package/>
        </Route>
        <Route path='/resetPassword/:uid/:token'>
          <ResetPassword/>
        </Route>
        <Route exact path=''>
          {dataFetched ?
            user ?
              <AppContext.Provider value={{user}}>{
                user.is_courier ? <CourierUI user={user} onLogout={this.logout}/>
                : user.is_sender ? <SenderUI user={user} onLogout={this.logout}/>
                : <OLMapUI onLogout={this.logout}/>
              }</AppContext.Provider>
            : <LoginScreen onLogin={() => this.refreshUser()}/>
          : <LoadScreen/>}
        </Route>
      </Switch>
    </Router>
  }
}

export default CityLogisticsUI;
