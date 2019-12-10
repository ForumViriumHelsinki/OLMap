import React from 'react';
import loadData, {logout} from "./loadData";
import LoginScreen from './components/LoginScreen';
import LoadScreen from "./components/LoadScreen";
import CourierUI from "./components/CourierUI";
import SenderUI from "./components/SenderUI";

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
    loadData('/rest/user/').then(response => {
      if (response.status == 404) this.setState({user: null, dataFetched: true});
      else response.json().then(user => this.setState({user, dataFetched: true}));
    })
  }

  logout() {
    logout();
    this.setState({user: null});
  }

  render() {
    const {user, dataFetched} = this.state;
    if (dataFetched) {
      if (user) {
        if (user.is_courier) return <CourierUI user={user} onLogout={this.logout} />;
        else return <SenderUI user={user} onLogout={this.logout}/>;
      } else return <LoginScreen onLogin={() => this.refreshUser()}/>
    } else return <LoadScreen/>;
  }
}

export default CityLogisticsUI;
