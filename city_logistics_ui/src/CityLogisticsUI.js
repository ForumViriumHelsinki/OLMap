import styles from 'leaflet/dist/leaflet.css';

import React from 'react';
import {
  HashRouter as Router,
  Switch,
  Route,
  useParams
} from "react-router-dom"

import sessionRequest, {logout} from "sessionRequest";

import LoginScreen from 'components/LoginScreen';
import LoadScreen from "components/LoadScreen";
import CourierUI from "components/CourierUI";
import SenderUI from "components/SenderUI";
import LivePackage from "components/LivePackage";

class CityLogisticsUI extends React.Component {
  state = {
    user: null,
    dataFetched: false
  }

  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    this.refreshUser();
  }

  refreshUser() {
    sessionRequest('/rest-auth/user/').then(response => {
      if (response.status == 401) this.setState({user: null, dataFetched: true});
      else response.json().then(user => this.setState({user, dataFetched: true}));
    })
  }

  logout() {
    sessionRequest('/rest-auth/logout/', {method: 'POST'}).then(response => {
      logout();
      this.setState({user: null});
    });
  }

  render() {
    const {user, dataFetched} = this.state;
    const Package = () => <LivePackage uuid={useParams().packageUUID}/>;

    return <Router>
      <Switch>
        <Route path='/package/:packageUUID'>
          <Package/>
        </Route>
        <Route exact path=''>
          {dataFetched ?
            user ?
              user.is_courier ? <CourierUI user={user} onLogout={this.logout} />
              : <SenderUI user={user} onLogout={this.logout}/>
            : <LoginScreen onLogin={() => this.refreshUser()}/>
          : <LoadScreen/>}
        </Route>
      </Switch>
    </Router>
  }
}

export default CityLogisticsUI;
